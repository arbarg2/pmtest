import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sections = [
  {
    h: "1. The service",
    body: [
      "Rìan provides blockchain address screening and risk information. You may use it to inform your own decisions and compliance processes.",
      "Rìan is read-only. It does not custody, transmit, exchange or manage crypto assets, and it is not a money services business, broker, exchange or wallet provider.",
    ],
  },
  {
    h: "2. No advice, no guarantee",
    body: [
      "Screening results are informational only. They are not legal, financial, tax or compliance advice, and they are not a regulatory determination.",
      "A SAFE verdict means we found no evidence against an address at the time of the check — it is not a guarantee that a counterparty is honest or that funds are recoverable. Blockchain data and third-party lists change constantly and can be incomplete or wrong.",
      "You remain solely responsible for your transactions and for meeting your own regulatory obligations.",
    ],
  },
  {
    h: "3. Acceptable use",
    body: [
      "Do not use Rìan to harass, dox or target individuals, to evade sanctions or law enforcement, or to build a competing dataset by bulk scraping.",
      "Do not attempt to bypass access controls, rate limits or authentication, and do not resell access without a written agreement.",
      "Automated access is permitted only through the documented API using your own key, within its published limits.",
    ],
  },
  {
    h: "4. Accounts and data",
    body: [
      "You are responsible for the security of your account credentials and for activity under your account.",
      "You retain ownership of the case notes and records you create. We process your data as described in our privacy policy, and you can request deletion of your account data at any time.",
    ],
  },
  {
    h: "5. Availability and changes",
    body: [
      "The service is provided on an 'as is' and 'as available' basis, without warranties of any kind. We do not commit to a specific uptime level unless agreed separately in writing.",
      "We may change or discontinue features, and we may update these terms. Material changes will be announced in the product or by email.",
    ],
  },
  {
    h: "6. Liability",
    body: [
      "To the maximum extent permitted by law, Rìan is not liable for indirect, incidental or consequential losses, including lost funds, lost profits or lost data arising from your use of the service or reliance on a screening result.",
    ],
  },
  {
    h: "7. Contact",
    body: ["Questions about these terms: support@rian.io"],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <Seo
        title="Terms of Service — Rìan"
        description="The terms that govern use of Rìan's blockchain address screening and risk intelligence service."
        path="/terms"
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
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: 13 August 2026</p>
        <div className="space-y-6">
          {sections.map((s) => (
            <Card key={s.h} className="p-6 bg-card/70 backdrop-blur-xl">
              <h2 className="text-lg font-semibold mb-3">{s.h}</h2>
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
      </main>
    </div>
  );
}
