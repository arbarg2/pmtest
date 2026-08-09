import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectNetwork, shortAddr } from "../_shared/screening.ts";

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

async function ethCounterparties(address: string, key: string) {
  const base = "https://api.etherscan.io/v2/api?chainid=1";
  const q = (action: string) =>
    `${base}&module=account&action=${action}&address=${address}&startblock=0&endblock=99999999&page=1&offset=500&sort=desc&apikey=${key}`;
  const [txRes, tokenRes] = await Promise.all([fetch(q("txlist")), fetch(q("tokentx"))]);
  const txs = await txRes.json().catch(() => ({}));
  const tokens = await tokenRes.json().catch(() => ({}));
  const all: any[] = [
    ...(Array.isArray(txs?.result) ? txs.result : []),
    ...(Array.isArray(tokens?.result) ? tokens.result : []),
  ];
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
  return { counterparties, txCount: all.length, firstSeen };
}

async function btcCounterparties(address: string) {
  const r = await fetch(`https://blockstream.info/api/address/${address}/txs`);
  const txs: any[] = r.ok ? await r.json() : [];
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
  return { counterparties, txCount: txs.length, firstSeen };
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
    if (!address || !network || network === "solana") {
      return new Response(
        JSON.stringify({ error: "Provide a valid Ethereum or Bitcoin address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { counterparties, txCount, firstSeen } =
      network === "ethereum"
        ? await ethCounterparties(address, Deno.env.get("ETHERSCAN_API_KEY") ?? "")
        : await btcCounterparties(address);

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
    if (mixerContacts.length) {
      score = Math.max(score, 75);
      reasons.push({
        type: "mixer",
        severity: "high",
        text: `Exposure to ${mixerContacts.length} known mixer contract(s).`,
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
        text: `${txCount} transactions across ${cpList.length} unique counterparties.`,
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
          text: `Wallet has been active for ${Math.round(ageDays)} days.`,
        });
      }
    }
    if (!sanctionedContacts.length && !mixerContacts.length && txCount > 0) {
      reasons.push({
        type: "clean",
        severity: "low",
        text: "No sanctioned or mixer counterparties found in the reviewed history.",
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
      first_seen: firstSeen,
      sanctioned_contacts: sanctionedContacts,
      mixer_contacts: mixerContacts,
      reasons,
      scanned_at: new Date().toISOString(),
    };

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

    return new Response(JSON.stringify({ ...report, record_id: saved?.record_id ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("wallet-health-check error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
