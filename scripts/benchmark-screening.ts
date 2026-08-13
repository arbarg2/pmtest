/**
 * Accuracy benchmark for the Rìan screening engine.
 *
 * Runs a fixed, publicly-documented label set through the deployed `safe-check`
 * endpoint and reports precision / recall against the expected verdict.
 * The point is to have a repeatable, honest number we can publish and re-run
 * after every ruleset change — not to prove the engine is perfect.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... bun run scripts/benchmark-screening.ts
 */

type Expected = "safe" | "caution" | "danger";

interface Case {
  address: string;
  expected: Expected;
  /** Why this address has this label — every case must be independently checkable. */
  source: string;
}

// Labels below come from public, citable sources only.
const CASES: Case[] = [
  // --- Known bad: OFAC SDN designated ---
  { address: "0x8589427373D6D84E98730D7795D8f6f8731FDA16", expected: "danger", source: "OFAC SDN — Tornado Cash router" },
  { address: "0x722122dF12D4e14e13Ac3b6895a86e84145b6967", expected: "danger", source: "OFAC SDN — Tornado Cash proxy" },
  { address: "0x7F367cC41522cE07553e823bf3be79A889DEbe1B", expected: "danger", source: "OFAC SDN — Lazarus Group (DPRK)" },
  { address: "0x098B716B8Aaf21512996dC57EB0615e2383E2f96", expected: "danger", source: "OFAC SDN — Ryuk ransomware" },

  // --- Known bad: tagged scam / drainer ---
  { address: "0xCa0503Da12BE05A46b1f1eD0Bf5f4c9EE1163c50", expected: "danger", source: "Etherscan name tag — Pink Drainer" },
  { address: "0x412f10AAd96fD78da6736387e2C84931Ac20313f", expected: "danger", source: "Etherscan name tag — Inferno Drainer" },

  // --- Known good: major infrastructure, no adverse listing ---
  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", expected: "safe", source: "Circle USDC token contract" },
  { address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", expected: "safe", source: "Uniswap V2 Router" },
  { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", expected: "safe", source: "Tether USDT token contract" },
  { address: "0x28C6c06298d514Db089934071355E5743bf21d60", expected: "safe", source: "Binance hot wallet 14" },
  { address: "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5", expected: "safe", source: "Bitfinex cold wallet (BTC)" },
];

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

async function check(address: string) {
  const url = `${SUPABASE_URL}/functions/v1/safe-check?address=${encodeURIComponent(address)}`;
  const r = await fetch(url, { headers: { apikey: ANON_KEY! } });
  const body = await r.json();
  if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`);
  return body as { verdict: Expected; risk_score: number };
}

// A "positive" is a DANGER call. CAUTION on a bad address counts as a miss for
// recall but is reported separately, because it still warns the user.
async function main() {
  let tp = 0, fp = 0, tn = 0, fn = 0, softHits = 0, errors = 0;
  const rows: string[] = [];

  for (const c of CASES) {
    try {
      const res = await check(c.address);
      const predictedBad = res.verdict === "danger";
      const actuallyBad = c.expected === "danger";

      if (predictedBad && actuallyBad) tp++;
      else if (predictedBad && !actuallyBad) fp++;
      else if (!predictedBad && actuallyBad) {
        fn++;
        if (res.verdict === "caution") softHits++;
      } else tn++;

      const ok = predictedBad === actuallyBad ? "PASS" : "FAIL";
      rows.push(
        `${ok.padEnd(4)} ${c.address.slice(0, 12)}… expected=${c.expected.padEnd(7)} got=${res.verdict.padEnd(7)} score=${String(res.risk_score).padStart(3)}  ${c.source}`,
      );
    } catch (e: any) {
      errors++;
      rows.push(`ERR  ${c.address.slice(0, 12)}… ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // stay under upstream rate limits
  }

  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

  console.log(rows.join("\n"));
  console.log("\n--- Rìan screening benchmark ---");
  console.log(`cases            ${CASES.length} (errors: ${errors})`);
  console.log(`true positives   ${tp}`);
  console.log(`false positives  ${fp}`);
  console.log(`false negatives  ${fn} (of which ${softHits} returned CAUTION)`);
  console.log(`true negatives   ${tn}`);
  console.log(`precision        ${(precision * 100).toFixed(1)}%`);
  console.log(`recall           ${(recall * 100).toFixed(1)}%`);
  console.log(`f1               ${(f1 * 100).toFixed(1)}%`);
  console.log("\nThis is a small, fixed label set. It measures regressions, not real-world accuracy.");

  if (fp > 0 || fn > 0) process.exitCode = 1;
}

main();
