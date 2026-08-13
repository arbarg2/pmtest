import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectNetwork, shortAddr } from "../_shared/screening.ts";
import { scanApprovals, EMPTY_APPROVAL_SCAN, type ApprovalScan } from "../_shared/approvals.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KNOWN_MIXERS: Record<string, string> = {
  "0x8589427373d6d84e98730d7795d8f6f8731fda16": "Tornado Cash Router",
  "0x722122df12d4e14e13ac3b6895a86e84145b6967": "Tornado Cash Proxy",
  "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": "Tornado Cash 10 ETH",
  "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf": "Tornado Cash 10 ETH",
  "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc": "Tornado Cash 0.1 ETH",
  "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936": "Tornado Cash 100 ETH",
  "0xa160cdab225685da1d56aa342ad8841c3b53f291": "Tornado Cash 100 ETH",
};

const ETH_TX_CAP = 500;
const BTC_TX_CAP = 500;

async function ethCounterparties(address: string, key: string) {
  const base = "https://api.etherscan.io/v2/api?chainid=1";
  const q = (action: string) =>
    `${base}&module=account&action=${action}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${ETH_TX_CAP}&sort=desc&apikey=${key}`;
  const [txRes, tokenRes] = await Promise.all([fetch(q("txlist")), fetch(q("tokentx"))]);
  const txs = await txRes.json().catch(() => ({}));
  const tokens = await tokenRes.json().catch(() => ({}));
  const nativeList: any[] = Array.isArray(txs?.result) ? txs.result : [];
  const tokenList: any[] = Array.isArray(tokens?.result) ? tokens.result : [];
  const all: any[] = [...nativeList, ...tokenList];
  const me = address.toLowerCase();
  const counterparties = new Map<string, { sent: number; received: number }>();
  let firstSeen: number | null = null;
  for (const t of all) {
    const ts = Number(t.timeStamp) * 1000;
    if (ts && (firstSeen === null || ts < firstSeen)) firstSeen = ts;
    const from = String(t.from ?? "").toLowerCase();
    const to = String(t.to ?? "").toLowerCase();
    const other = from === me ? to : from;
    if (!other || other === me) continue;
    const rec = counterparties.get(other) ?? { sent: 0, received: 0 };
    if (from === me) rec.sent += 1;
    else rec.received += 1;
    counterparties.set(other, rec);
  }
  // Etherscan returns at most `offset` records per list, so hitting the cap
  // means we only saw the most recent slice of this wallet's history.
  const truncated = nativeList.length >= ETH_TX_CAP || tokenList.length >= ETH_TX_CAP;
  return { counterparties, txCount: all.length, firstSeen, truncated };
}

/**
 * Blockstream returns 25 confirmed txs per page and requires cursor pagination
 * via /txs/chain/:last_seen_txid. Without this the counterparty count and the
 * transaction total were silently limited to the first page.
 */
async function btcCounterparties(address: string) {
  const txs: any[] = [];
  let cursor: string | null = null;
  let truncated = false;

  while (txs.length < BTC_TX_CAP) {
    const url = cursor
      ? `https://blockstream.info/api/address/${address}/txs/chain/${cursor}`
      : `https://blockstream.info/api/address/${address}/txs`;
    const r = await fetch(url);
    if (!r.ok) break;
    const page: any[] = await r.json().catch(() => []);
    if (!page.length) break;
    txs.push(...page);
    cursor = page[page.length - 1]?.txid ?? null;
    if (!cursor || page.length < 25) break;
    if (txs.length >= BTC_TX_CAP) {
      truncated = true;
      break;
    }
  }

  const counterparties = new Map<string, { sent: number; received: number }>();
  let firstSeen: number | null = null;
  for (const t of txs) {
    const ts = t.status?.block_time ? t.status.block_time * 1000 : null;
    if (ts && (firstSeen === null || ts < firstSeen)) firstSeen = ts;
    const isSender = (t.vin ?? []).some(
      (i: any) => i.prevout?.scriptpubkey_address === address,
    );
    for (const o of t.vout ?? []) {
      const a = o.scriptpubkey_address;
      if (!a || a === address) continue;
      const rec = counterparties.get(a) ?? { sent: 0, received: 0 };
      if (isSender) rec.sent += 1;
      else rec.received += 1;
      counterparties.set(a, rec);
    }
    if (!isSender) continue;
    for (const i of t.vin ?? []) {
      const a = i.prevout?.scriptpubkey_address;
      if (!a || a === address) continue;
      const rec = counterparties.get(a) ?? { sent: 0, received: 0 };
      rec.received += 1;
      counterparties.set(a, rec);
    }
  }
  return { counterparties, txCount: txs.length, firstSeen, truncated };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    const userId = claims?.claims?.sub;
    if (authErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const address = String(body?.address ?? "").trim();
    const network = detectNetwork(address);

    if (!address || !network) {
      return new Response(
        JSON.stringify({ error: "Provide a valid Ethereum or Bitcoin address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (network === "solana") {
      return new Response(
        JSON.stringify({
          error: "solana_unsupported",
          message:
            "Wallet Health Check does not support Solana yet — the counterparty graph is Ethereum and Bitcoin only. Use Safe Check for a Solana address.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const etherscanKey = Deno.env.get("ETHERSCAN_API_KEY") ?? "";

    const [graph, approvals] = await Promise.all([
      network === "ethereum"
        ? ethCounterparties(address, etherscanKey)
        : btcCounterparties(address),
      network === "ethereum"
        ? scanApprovals(admin, address, etherscanKey)
        : Promise.resolve({ ...EMPTY_APPROVAL_SCAN } as ApprovalScan),
    ]);
    const { counterparties, txCount, firstSeen, truncated } = graph;

    const cpList = [...counterparties.keys()];

    // Batch sanctions lookup (chunked)
    const sanctioned: any[] = [];
    for (let i = 0; i < cpList.length; i += 200) {
      const chunk = cpList.slice(i, i + 200);
      const { data } = await admin
        .from("sanctions_addresses")
        .select("address, entity_name, source_list, program, network")
        .in("address", chunk);
      if (data?.length) sanctioned.push(...data);
      if (network === "ethereum") {
        // sanctions list may store checksum-cased addresses
        const { data: upper } = await admin
          .from("sanctions_addresses")
          .select("address, entity_name, source_list, program, network")
          .in("address", chunk.map((a) => a.toUpperCase()));
        if (upper?.length) sanctioned.push(...upper);
      }
    }

    const sanctionedContacts = sanctioned.map((s) => {
      const key = String(s.address).toLowerCase();
      const flow = counterparties.get(key);
      return {
        address: s.address,
        entity_name: s.entity_name,
        source_list: s.source_list,
        program: s.program,
        sent_txs: flow?.sent ?? 0,
        received_txs: flow?.received ?? 0,
      };
    });

    // Known scam / drainer counterparties
    const maliciousContacts: any[] = [];
    for (let i = 0; i < cpList.length; i += 200) {
      const chunk = cpList.slice(i, i + 200);
      const { data } = await admin
        .from("malicious_addresses")
        .select("address, label, category, source")
        .in("address", chunk);
      for (const m of data ?? []) {
        const flow = counterparties.get(String(m.address).toLowerCase());
        maliciousContacts.push({ ...m, sent_txs: flow?.sent ?? 0, received_txs: flow?.received ?? 0 });
      }
    }

    const mixerContacts = cpList
      .filter((a) => KNOWN_MIXERS[a])
      .map((a) => ({ address: a, label: KNOWN_MIXERS[a], ...counterparties.get(a)! }));

    const reasons: { type: string; severity: "low" | "medium" | "high"; text: string }[] = [];
    let score = 5;

    if (sanctionedContacts.length) {
      score = 95;
      reasons.push({
        type: "sanctions",
        severity: "high",
        text: `Direct interaction with ${sanctionedContacts.length} OFAC-sanctioned address(es).`,
      });
    }
    if (maliciousContacts.length) {
      score = Math.max(score, 90);
      reasons.push({
        type: "scam",
        severity: "high",
        text: `Interaction with ${maliciousContacts.length} known scam / drainer address(es).`,
      });
    }
    if (mixerContacts.length) {
      score = Math.max(score, 75);
      reasons.push({
        type: "mixer",
        severity: "high",
        text: `Exposure to ${mixerContacts.length} known mixer contract(s).`,
      });
    }

    const highRiskApprovals = approvals.risky_approvals.filter((a) => a.risk === "high");
    if (highRiskApprovals.length) {
      score = Math.max(score, 70);
      reasons.push({
        type: "approval",
        severity: "high",
        text: `${highRiskApprovals.length} high-risk token approval(s) still active — a contract can move those tokens without asking you again.`,
      });
    } else if (approvals.unlimited_count) {
      score = Math.max(score, 40);
      reasons.push({
        type: "approval",
        severity: "medium",
        text: `${approvals.unlimited_count} unlimited token approval(s) still active.`,
      });
    } else if (approvals.supported) {
      reasons.push({
        type: "approval",
        severity: "low",
        text: "No unlimited or high-risk token approvals outstanding.",
      });
    }

    if (txCount === 0) {
      score = Math.max(score, 30);
      reasons.push({
        type: "fresh",
        severity: "medium",
        text: "No transaction history found for this wallet.",
      });
    } else {
      reasons.push({
        type: "history",
        severity: "low",
        text: truncated
          ? `${txCount} most recent transactions reviewed across ${cpList.length} unique counterparties (history capped for speed).`
          : `${txCount} transactions across ${cpList.length} unique counterparties.`,
      });
    }
    const ageDays = firstSeen ? (Date.now() - firstSeen) / 86400000 : null;
    if (ageDays !== null) {
      if (ageDays < 30) {
        score = Math.max(score, 35);
        reasons.push({
          type: "age",
          severity: "medium",
          text: `Wallet is only ${Math.max(1, Math.round(ageDays))} days old.`,
        });
      } else {
        reasons.push({
          type: "age",
          severity: "low",
          text: truncated
            ? `Active for at least ${Math.round(ageDays)} days within the reviewed window.`
            : `Wallet has been active for ${Math.round(ageDays)} days.`,
        });
      }
    }
    if (!sanctionedContacts.length && !mixerContacts.length && !maliciousContacts.length && txCount > 0) {
      reasons.push({
        type: "clean",
        severity: "low",
        text: "No sanctioned, scam or mixer counterparties found in the reviewed history.",
      });
    }

    const verdict = score >= 70 ? "danger" : score >= 35 ? "caution" : "safe";
    const riskLevel = score >= 70 ? "critical" : score >= 50 ? "high" : score >= 35 ? "medium" : "low";

    const report = {
      address,
      short: shortAddr(address),
      network,
      verdict,
      risk_score: score,
      total_counterparties: cpList.length,
      total_transactions: txCount,
      history_truncated: truncated,
      first_seen: firstSeen,
      sanctioned_contacts: sanctionedContacts,
      malicious_contacts: maliciousContacts,
      mixer_contacts: mixerContacts,
      approvals: {
        supported: approvals.supported,
        total_spenders: approvals.total_spenders,
        unlimited_count: approvals.unlimited_count,
        risky: approvals.risky_approvals,
      },
      reasons,
      scanned_at: new Date().toISOString(),
    };

    // Shareable, deep-linkable copy of the report
    const { data: shared } = await admin
      .from("health_reports")
      .insert({
        address,
        network,
        verdict,
        risk_score: score,
        report,
      })
      .select("id")
      .maybeSingle();

    // Persist as an investigation record for dashboard history
    const { data: saved } = await admin
      .from("investigation_records")
      .insert({
        user_id: userId,
        wallet_address: address,
        network,
        risk_score: score,
        risk_level: riskLevel,
        analysis_data: { health_check: report },
        tags: ["wallet-health-check"],
      })
      .select("record_id")
      .maybeSingle();

    return new Response(
      JSON.stringify({
        ...report,
        report_id: shared?.id ?? null,
        record_id: saved?.record_id ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("wallet-health-check error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
