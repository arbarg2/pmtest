import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sections = [
  {
    h: "What a verdict means",
    body: [
      "Every check returns one of three verdicts. SAFE means we found no match on any list we screen and nothing unusual in the address's on-chain behaviour. CAUTION means we found something worth a human look — a young wallet, unusual activity, or an indirect link to a flagged address. DANGER means a direct match: the address is on the OFAC SDN list, is tagged as a scam or wallet-drainer, or has interacted directly with a mixer.",
      "A verdict is a screening signal, not a legal conclusion. SAFE does not mean an address is trustworthy — it means we have no evidence against it. New scam addresses appear before any list catches them.",
    ],
  },
  {
    h: "Data sources",
    body: [
      "Sanctions: the U.S. Treasury OFAC Specially Designated Nationals (SDN) list, including the digital-currency addresses published with each entry. We re-sync the list daily and store the source list, program and entity name with every match so a hit can be traced back to its published entry.",
      "Scam and drainer addresses: Etherscan's public name tags for phishing, hack and exploit addresses, aggregated via the open dawsbot/evm-labels dataset, plus a curated seed of known drainer contracts. Re-synced daily. Every match records the label, category and source.",
      "Mixers: a maintained list of known mixer contract addresses (for example Tornado Cash pools and routers).",
      "Chain data: Etherscan (Ethereum), Blockstream (Bitcoin) and public Solana RPC. Balances, transaction counts, first-seen dates and counterparties come from these sources directly.",
    ],
  },
  {
    h: "Scoring",
    body: [
      "The risk score runs 0-100 and is driven by the strongest signal found, not by an average. A direct OFAC match scores 95. A scam or drainer match scores 90. Direct mixer exposure scores 75. Live high-risk token approvals score 70. Softer signals — a wallet under 30 days old, no transaction history, unlimited approvals — raise the score into the caution band but never on their own produce a DANGER verdict.",
      "Scores above 70 are DANGER, 35-69 is CAUTION, below 35 is SAFE. The individual reasons behind a score are always shown with the result — there is no hidden weighting you cannot see.",
    ],
  },
  {
    h: "Coverage and limits",
    body: [
      "Ethereum: full screening, counterparty graph and ERC-20 token approval scanning. Bitcoin: full screening and counterparty graph, no approvals (they don't exist on Bitcoin). Solana: address screening and basic activity only — no counterparty graph and no health check.",
      "History depth is capped for speed. A wallet health check reads up to the 500 most recent transactions; when that cap is reached the report says so explicitly. Older exposure outside that window will not appear.",
      "We screen for direct matches and direct counterparties. We do not currently score multi-hop indirect exposure, and we do not perform entity clustering across a whole exchange or service.",
      "Rìan is read-only. We never request a signature, a seed phrase, or a wallet connection that can move funds.",
    ],
  },
  {
    h: "False positives and disputes",
    body: [
      "Address-level lists carry real false-positive risk: an address can be tagged because it received funds from a scam, not because it ran one. Every match we show names its source so you can verify it yourself before acting.",
      "If you believe an address is wrongly flagged, contact us with the address and your reasoning. We can suppress a match in your workspace, but we do not alter the upstream OFAC or Etherscan data — that has to be corrected at the source.",
    ],
  },
];

export default function Methodology() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <Seo
        title="Methodology — How Rìan Scores Wallet Risk"
        description="The data sources, scoring rules, coverage and known limits behind every Rìan wallet risk verdict."
        path="/methodology"
      />
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold tracking-tight">Rìan</span>
          </Link>
          <Link to="/safe">
            <Button size="sm" className="gap-1">
              Run a check <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Methodology</h1>
        <p className="text-muted-foreground text-lg mb-10">
          How Rìan reaches a verdict, what data sits behind it, and where the limits are. If a claim
          isn't on this page, we don't make it.
        </p>

        <div className="space-y-8">
          {sections.map((s) => (
            <Card key={s.h} className="p-6 bg-card/70 backdrop-blur-xl">
              <h2 className="text-xl font-semibold mb-3">{s.h}</h2>
              <div className="space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-10">
          Rìan provides screening information, not legal, financial or compliance advice. You remain
          responsible for your own decisions and regulatory obligations.
        </p>
      </main>
    </div>
  );
}
