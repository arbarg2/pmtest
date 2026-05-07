import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Network = "bitcoin" | "ethereum" | "solana";

function detectNetwork(address: string): Network | null {
  const a = address.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return "ethereum";
  if (/^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a)) return "bitcoin";
  if (/^bc1[a-z0-9]{39,59}$/.test(a)) return "bitcoin";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return "solana";
  return null;
}

function shortAddr(a: string) {
  return a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

async function fetchEth(address: string, etherscanKey: string) {
  const base = "https://api.etherscan.io/v2/api?chainid=1";
  const [balRes, txRes] = await Promise.all([
    fetch(`${base}&module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanKey}`),
    fetch(`${base}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${etherscanKey}`),
  ]);
  const bal = await balRes.json();
  const txs = await txRes.json();
  const balance = bal?.result ? Number(bal.result) / 1e18 : 0;
  const txList: any[] = Array.isArray(txs?.result) ? txs.result : [];
  const firstSeen = txList.length ? Number(txList[txList.length - 1].timeStamp) * 1000 : null;
  return { balance, txCount: txList.length, firstSeen, txs: txList };
}

async function fetchBtc(address: string) {
  const r = await fetch(`https://blockstream.info/api/address/${address}`);
  if (!r.ok) throw new Error(`Blockstream ${r.status}`);
  const d = await r.json();
  const balance = ((d.chain_stats?.funded_txo_sum ?? 0) - (d.chain_stats?.spent_txo_sum ?? 0)) / 1e8;
  const txCount = (d.chain_stats?.tx_count ?? 0) + (d.mempool_stats?.tx_count ?? 0);
  return { balance, txCount, firstSeen: null, txs: [] as any[] };
}

async function fetchSol(address: string) {
  const r = await fetch("https://api.mainnet-beta.solana.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
  });
  const d = await r.json();
  const balance = d?.result?.value ? d.result.value / 1e9 : 0;
  return { balance, txCount: 0, firstSeen: null, txs: [] as any[] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const address = (url.searchParams.get("address") ?? "").trim();
    if (!address) {
      return new Response(JSON.stringify({ error: "address required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const network = detectNetwork(address);
    if (!network) {
      return new Response(JSON.stringify({ error: "Unsupported address format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Cache hit (15 min)
    const { data: cached } = await supabase
      .from("public_checks")
      .select("*")
      .eq("network", network)
      .ilike("address", address)
      .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .maybeSingle();

    if (cached) {
      await supabase.from("public_checks").update({ view_count: (cached.view_count ?? 0) + 1 }).eq("id", cached.id);
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanctions hit
    const { data: sanctionsHit } = await supabase
      .from("sanctions_addresses")
      .select("entity_name, source_list, program")
      .ilike("address", address)
      .maybeSingle();

    // Chain data
    let chain: { balance: number; txCount: number; firstSeen: number | null; txs: any[] };
    try {
      if (network === "ethereum") {
        const k = Deno.env.get("ETHERSCAN_API_KEY") ?? "";
        chain = await fetchEth(address, k);
      } else if (network === "bitcoin") {
        chain = await fetchBtc(address);
      } else {
        chain = await fetchSol(address);
      }
    } catch (e) {
      console.error("chain fetch failed", e);
      chain = { balance: 0, txCount: 0, firstSeen: null, txs: [] };
    }

    // Reasons + score
    const reasons: { type: string; severity: "low" | "medium" | "high"; text: string }[] = [];
    let score = 5; // baseline 0-100

    if (sanctionsHit) {
      reasons.push({
        type: "sanctions",
        severity: "high",
        text: `Direct OFAC match: ${sanctionsHit.entity_name ?? "Listed entity"} (${sanctionsHit.source_list ?? "OFAC"}). Do NOT send funds.`,
      });
      score = 100;
    }

    if (chain.txCount === 0) {
      reasons.push({
        type: "fresh",
        severity: "medium",
        text: "Brand-new wallet with zero on-chain history. Cannot verify reputation.",
      });
      score = Math.max(score, 45);
    } else if (chain.txCount < 5) {
      reasons.push({
        type: "low_activity",
        severity: "medium",
        text: `Only ${chain.txCount} transactions on record. Limited reputation signal.`,
      });
      score = Math.max(score, 30);
    } else {
      reasons.push({
        type: "history",
        severity: "low",
        text: `${chain.txCount}+ transactions on record. Established on-chain history.`,
      });
    }

    if (chain.firstSeen) {
      const ageDays = (Date.now() - chain.firstSeen) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        reasons.push({ type: "age", severity: "medium", text: `Wallet first seen ${Math.max(1, Math.round(ageDays))} day(s) ago.` });
        score = Math.max(score, 40);
      } else if (ageDays > 365) {
        reasons.push({ type: "age", severity: "low", text: `Wallet active for over ${Math.round(ageDays / 365)} year(s).` });
      }
    }

    if (chain.balance > 0) {
      reasons.push({ type: "balance", severity: "low", text: `Holds ${chain.balance.toFixed(4)} ${network.toUpperCase()}.` });
    }

    // Drainer/scam heuristic for ETH: many tiny outbound txs in short window
    if (network === "ethereum" && chain.txs.length >= 10) {
      const recent = chain.txs.slice(0, 20);
      const outbound = recent.filter((t) => t.from?.toLowerCase() === address.toLowerCase()).length;
      if (outbound > 15) {
        reasons.push({
          type: "pattern",
          severity: "medium",
          text: "High outbound transaction frequency — consistent with drainer/sweeper patterns.",
        });
        score = Math.max(score, 55);
      }
    }

    const verdict = score >= 70 ? "danger" : score >= 35 ? "caution" : "safe";

    const payload = {
      address,
      network,
      verdict,
      risk_score: score,
      reasons,
      data: {
        balance: chain.balance,
        tx_count: chain.txCount,
        first_seen: chain.firstSeen,
        sanctioned: !!sanctionsHit,
        short: shortAddr(address),
      },
      view_count: 1,
    };

    const { data: inserted, error } = await supabase
      .from("public_checks")
      .upsert(payload, { onConflict: "address,network", ignoreDuplicates: false })
      .select()
      .maybeSingle();

    if (error) console.warn("cache insert failed", error.message);

    return new Response(JSON.stringify({ ...(inserted ?? payload), cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("safe-check error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
