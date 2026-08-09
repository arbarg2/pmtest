import Seo from '@/components/Seo';
import React, { useState } from 'react';
import { Shield, Copy, Check, Terminal, Zap, Lock, Gauge, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import ApiKeysPanel from '@/components/api/ApiKeysPanel';
import WebhookEndpoints from '@/components/settings/WebhookEndpoints';
import { API_BASE_URL } from '@/services/apiKeys';

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-lg border border-border/60 bg-background/70 overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
          {label}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-xs font-mono text-foreground/90 leading-relaxed">{code}</pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-1.5 right-1.5"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
};

const Method: React.FC<{ m: string }> = ({ m }) => (
  <Badge
    variant="outline"
    className={`font-mono text-[10px] ${m === 'GET' ? 'text-neon-cyan border-neon-cyan/40' : 'text-neon-violet border-neon-violet/40'}`}
  >
    {m}
  </Badge>
);

const Endpoint: React.FC<{
  method: string;
  path: string;
  description: string;
  children?: React.ReactNode;
}> = ({ method, path, description, children }) => (
  <Card className="bg-card/60 backdrop-blur-sm border-border/60">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Method m={method} />
        <code className="font-mono text-sm text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground pt-1">{description}</p>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const ApiDocs = () => {
  const navigate = useNavigate();

  return (
      <Seo title="Rìan API Docs — Wallet Screening API v1" description="REST API for wallet risk screening, batch checks and OFAC sanctions lookups, with API keys, rate limits and signed webhooks." path="/api-docs" />
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-aurora">Rìan API v1</h1>
              <p className="text-xs text-muted-foreground">Wallet risk & sanctions screening for developers</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            ← Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Screen any wallet in <span className="text-aurora">one request</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            The Rìan API returns a plain-English verdict, a 0–100 risk score, OFAC sanctions matches and the on-chain
            signals behind them — for Bitcoin, Ethereum and Solana addresses.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {[
              { icon: Lock, title: 'Hashed keys', text: 'Keys are SHA-256 hashed at rest and shown once.' },
              { icon: Gauge, title: 'Fair limits', text: '60 req/min and 1,000 req/month on the free tier.' },
              { icon: Zap, title: 'Same engine', text: 'Identical scoring to the Rìan product itself.' },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border border-border/60 bg-card/50 p-4">
                <f.icon className="w-4 h-4 text-primary mb-2" />
                <div className="text-sm font-semibold text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{f.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Keys */}
        <section id="keys" className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">1. Get an API key</h3>
          <ApiKeysPanel />
        </section>

        {/* Webhooks */}
        <section id="webhooks" className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Signed webhooks</h3>
          <WebhookEndpoints />
        </section>

        {/* Auth */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">2. Authenticate</h3>
          <p className="text-sm text-muted-foreground">
            Send your key as a bearer token on every request. Keys are secret — call the API from your server, never
            from browser code.
          </p>
          <CodeBlock label="Base URL" code={API_BASE_URL} />
          <CodeBlock
            label="curl"
            code={`curl "${API_BASE_URL}/v1/screen?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" \\
  -H "Authorization: Bearer rian_live_your_key_here"`}
          />
        </section>

        {/* Endpoints */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">3. Endpoints</h3>

          <Endpoint
            method="GET"
            path="/v1/screen"
            description="Full risk screen for a single address. Auto-detects Bitcoin, Ethereum or Solana."
          >
            <CodeBlock
              label="Request"
              code={`GET ${API_BASE_URL}/v1/screen?address=<address>
Authorization: Bearer rian_live_...`}
            />
            <CodeBlock
              label="200 Response"
              code={`{
  "address": "0xd8dA6BF2...96045",
  "network": "ethereum",
  "verdict": "safe",              // safe | caution | danger
  "risk_score": 5,                 // 0-100
  "reasons": [
    { "type": "history", "severity": "low", "text": "25+ transactions on record." }
  ],
  "data": {
    "balance": 1.234,
    "tx_count": 25,
    "first_seen": 1620000000000,
    "sanctioned": false,
    "short": "0xd8dA…6045"
  },
  "sanctions": { "matched": false, "entity_name": null, "source_list": null, "program": null }
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/screen/batch"
            description="Screen up to 25 addresses in a single request. Counts as one request against your quota."
          >
            <CodeBlock
              label="Request"
              code={`curl -X POST "${API_BASE_URL}/v1/screen/batch" \\
  -H "Authorization: Bearer rian_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"addresses":["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"]}'`}
            />
            <CodeBlock label="200 Response" code={`{ "count": 2, "results": [ { /* screen result */ }, { /* screen result */ } ] }`} />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/sanctions/check"
            description="Direct lookup against the synced OFAC SDN address list. Fast, no chain calls."
          >
            <CodeBlock
              label="200 Response"
              code={`{
  "address": "0x7F367cC41522cE07553e823bf3be79A889DEbe1B",
  "matched": true,
  "match": {
    "entity_name": "LAZARUS GROUP",
    "source_list": "OFAC_SDN",
    "program": "DPRK",
    "date_listed": "2022-04-14",
    "network": "ethereum"
  }
}`}
            />
          </Endpoint>

          <Endpoint method="GET" path="/v1/me" description="Inspect the current key, its plan and remaining quota.">
            <CodeBlock
              label="200 Response"
              code={`{
  "key": { "id": "…", "name": "Production backend", "plan": "free" },
  "limits": {
    "rate_limit_per_min": 60,
    "monthly_quota": 1000,
    "used_this_month": 42,
    "remaining_this_month": 958
  }
}`}
            />
          </Endpoint>
        </section>

        {/* Limits + errors */}
        <section className="grid md:grid-cols-2 gap-4">
          <Card className="bg-card/60 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Gauge className="w-4 h-4 mr-2 text-primary" /> Rate limits & quotas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Every response includes live limit headers:</p>
              <CodeBlock
                code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-Quota-Limit: 1000
X-Quota-Remaining: 958`}
              />
              <p>Exceeding either limit returns <code className="font-mono text-xs">429</code> with a <code className="font-mono text-xs">Retry-After</code> header.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <AlertTriangle className="w-4 h-4 mr-2 text-primary" /> Errors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock
                code={`{ "error": { "code": "invalid_api_key",
            "message": "This API key is not recognised.",
            "docs": "https://tryrian.lovable.app/api-docs" } }`}
              />
              <ul className="text-sm text-muted-foreground space-y-1 font-mono text-xs">
                <li>401 missing_api_key · invalid_api_key</li>
                <li>403 revoked_api_key</li>
                <li>400 invalid_request · unsupported_address</li>
                <li>429 rate_limit_exceeded · quota_exceeded</li>
                <li>500 internal_error</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Quickstart snippets */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center">
            <Terminal className="w-5 h-5 mr-2 text-primary" /> Server-side snippets
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <CodeBlock
              label="Node.js"
              code={`const res = await fetch(
  "${API_BASE_URL}/v1/screen?address=" + address,
  { headers: { Authorization: \`Bearer \${process.env.RIAN_API_KEY}\` } }
);
const result = await res.json();
if (result.verdict === "danger") blockPayout();`}
            />
            <CodeBlock
              label="Python"
              code={`import os, requests

r = requests.get(
    "${API_BASE_URL}/v1/screen",
    params={"address": address},
    headers={"Authorization": f"Bearer {os.environ['RIAN_API_KEY']}"},
    timeout=20,
)
result = r.json()
print(result["verdict"], result["risk_score"])`}
            />
          </div>
        </section>

        <p className="text-xs text-muted-foreground pb-10">
          Rìan screening output is decision support, not legal advice. Always pair automated screening with your own
          compliance review before blocking or reporting a counterparty.
        </p>
      </main>
    </div>
  );
};

export default ApiDocs;
