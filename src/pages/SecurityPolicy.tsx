import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sections = [
  {
    h: "How we handle your data",
    body: [
      "Rìan is read-only against public blockchain data. We never ask for a seed phrase or private key, and no feature in the product can move, approve or spend funds. Connecting a browser wallet is only used to read your public address.",
      "Account data is limited to your email, sign-in metadata, and the investigation records you create. Wallet addresses you check are stored so you can revisit your own history.",
      "Data is stored in a managed Postgres database with row-level access rules, so records are readable only by the account or workspace that created them. Access is over TLS.",
    ],
  },
  {
    h: "Access control",
    body: [
      "Accounts can belong to workspaces with owner, admin and analyst roles. Roles are enforced in the database, not in the browser, so changing anything client-side cannot grant extra access.",
      "Sensitive actions — screening decisions, report exports and case changes — are written to an append-only audit log with the acting user and timestamp.",
      "API keys used to reach blockchain data providers live only on the server side and are never sent to the browser.",
    ],
  },
  {
    h: "Reporting a vulnerability",
    body: [
      "If you believe you've found a security issue, email support@rian.io with the words 'security report' in the subject and enough detail to reproduce it. Please give us a reasonable window to respond before disclosing publicly.",
      "Please do not run automated scanners against production, access accounts or data that are not yours, or perform testing that degrades the service for other users.",
      "We aim to acknowledge reports within three business days.",
    ],
  },
  {
    h: "What we don't claim",
    body: [
      "Rìan holds no third-party security certification and has not completed a SOC 2, ISO 27001 or equivalent audit. We will say so plainly here if that ever changes.",
      "Screening results are informational. They do not constitute a regulatory determination and no result should be treated as a guarantee that funds are safe or recoverable.",
    ],
  },
];

export default function SecurityPolicy() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <Seo
        title="Security & Responsible Disclosure — Rìan"
        description="How Rìan handles your data, enforces access control, and how to report a security vulnerability."
        path="/security-policy"
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
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Security</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Our security posture, in plain terms — including the things we deliberately don't claim.
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
      </main>
    </div>
  );
}
