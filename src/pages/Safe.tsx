import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Shield, Search, AlertTriangle, CheckCircle2, ShieldAlert, Share2, ArrowRight, Sparkles, Eye, Lock, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Verdict = "safe" | "caution" | "danger";

interface CheckResult {
  address: string;
  network: string;
  verdict: Verdict;
  risk_score: number;
  reasons: { type: string; severity: "low" | "medium" | "high"; text: string }[];
  data: { balance?: number; tx_count?: number; first_seen?: number | null; sanctioned?: boolean; short?: string };
  view_count?: number;
  cached?: boolean;
}

const verdictMeta: Record<Verdict, { label: string; sub: string; tone: string; ring: string; glow: string; icon: any }> = {
  safe: {
    label: "LIKELY SAFE",
    sub: "No major red flags found.",
    tone: "text-risk-low",
    ring: "ring-risk-low/40 border-risk-low/40",
    glow: "shadow-[0_0_60px_-10px_hsl(var(--risk-low)/0.6)]",
    icon: CheckCircle2,
  },
  caution: {
    label: "PROCEED WITH CAUTION",
    sub: "Some signals worth reviewing before you send.",
    tone: "text-risk-medium",
    ring: "ring-risk-medium/40 border-risk-medium/40",
    glow: "shadow-[0_0_60px_-10px_hsl(var(--risk-medium)/0.6)]",
    icon: AlertTriangle,
  },
  danger: {
    label: "DO NOT SEND",
    sub: "High-risk wallet. Funds could be lost or frozen.",
    tone: "text-risk-critical",
    ring: "ring-risk-critical/40 border-risk-critical/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-critical)/0.7)]",
    icon: ShieldAlert,
  },
};

function SafeHeader() {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/safe" className="flex items-center gap-2 group">
          <div className="relative">
            <Shield className="w-7 h-7 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-primary/30 blur-xl -z-10" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">Rìan <span className="text-primary">Safe</span></div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Pre-send safety check</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-xs">Pro Console</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="text-xs">Sign in</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function VerdictCard({ result }: { result: CheckResult }) {
  const meta = verdictMeta[result.verdict];
  const Icon = meta.icon;
  return (
    <Card className={`relative overflow-hidden p-8 md:p-10 border-2 ${meta.ring} ${meta.glow} bg-card/80 backdrop-blur-xl`}>
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-current opacity-10 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center bg-background/60 border ${meta.ring}`}>
          <Icon className={`w-12 h-12 ${meta.tone}`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold tracking-[0.2em] ${meta.tone}`}>VERDICT</span>
            {result.cached && <Badge variant="outline" className="text-[10px] h-5">cached</Badge>}
          </div>
          <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${meta.tone}`}>{meta.label}</h2>
          <p className="text-muted-foreground mt-1">{meta.sub}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
            <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{result.data.short ?? result.address}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{result.network}</span>
            <span className="text-xs text-muted-foreground">Risk score <span className={`font-bold ${meta.tone}`}>{result.risk_score}</span>/100</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReasonsList({ reasons }: { reasons: CheckResult["reasons"] }) {
  if (!reasons.length) return null;
  const sevTone = (s: string) =>
    s === "high" ? "text-risk-critical bg-risk-critical/10 border-risk-critical/30"
    : s === "medium" ? "text-risk-medium bg-risk-medium/10 border-risk-medium/30"
    : "text-risk-low bg-risk-low/10 border-risk-low/30";
  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/60">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Why
      </h3>
      <ul className="space-y-3">
        {reasons.map((r, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${sevTone(r.severity)} flex-shrink-0`}>
              {r.severity}
            </span>
            <p className="text-sm leading-relaxed pt-0.5">{r.text}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StatsGrid({ result }: { result: CheckResult }) {
  const stats = [
    { label: "Balance", value: result.data.balance != null ? `${result.data.balance.toFixed(4)} ${result.network.slice(0, 3).toUpperCase()}` : "—" },
    { label: "Transactions", value: result.data.tx_count?.toLocaleString() ?? "—" },
    { label: "First seen", value: result.data.first_seen ? new Date(result.data.first_seen).toLocaleDateString() : "—" },
    { label: "Sanctions", value: result.data.sanctioned ? "MATCH" : "Clear" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-4 bg-card/40 border-border/50">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</div>
          <div className={`text-base font-semibold tabular-nums ${s.label === "Sanctions" && s.value === "MATCH" ? "text-risk-critical" : ""}`}>{s.value}</div>
        </Card>
      ))}
    </div>
  );
}

function ShareBar({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/safe/check/${address}`;
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Card className="p-4 bg-card/40 border-border/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Share this verdict</div>
        <div className="font-mono text-xs truncate">{url}</div>
      </div>
      <Button onClick={copy} variant="outline" size="sm" className="gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </Card>
  );
}

export function SafeCheckRunner({ address, onResult }: { address: string; onResult?: (r: CheckResult) => void }) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("safe-check", {
          method: "GET" as any,
          // pass address via query — invoke supports body, but we use direct fetch below for GET params
        } as any).catch(() => ({ data: null, error: { message: "fallback" } } as any));

        let payload: any = data;
        if (!data || fnErr) {
          // Fallback: direct fetch with query string
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/safe-check?address=${encodeURIComponent(address)}`;
          const r = await fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          payload = await r.json();
          if (!r.ok) throw new Error(payload?.error || "Check failed");
        }
        if (cancelled) return;
        setResult(payload);
        onResult?.(payload);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Check failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (loading) {
    return (
      <Card className="p-10 border-border/50 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <Shield className="absolute inset-0 m-auto w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <div className="font-semibold">Checking the chain…</div>
            <div className="text-xs text-muted-foreground mt-1">Sanctions, history, on-chain patterns.</div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !result) {
    return (
      <Card className="p-6 border-risk-critical/40 bg-risk-critical/5">
        <div className="text-risk-critical font-semibold">Couldn't run the check</div>
        <p className="text-sm text-muted-foreground mt-1">{error ?? "Try again."}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <VerdictCard result={result} />
      <ReasonsList reasons={result.reasons} />
      <StatsGrid result={result} />
      <ShareBar address={result.address} />
    </div>
  );
}

export default function Safe() {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    navigate(`/safe/check/${v}`);
  };
  return (
    <div className="min-h-screen bg-background">
      <SafeHeader />
      <main className="max-w-3xl mx-auto px-4 pt-12 md:pt-20 pb-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
            <Sparkles className="w-3 h-3 mr-1" /> Free • No login needed
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Don't send to <span className="text-risk-critical">scammers</span>.<br />
            Check first.
          </h1>
          <p className="text-muted-foreground mt-5 text-lg max-w-xl mx-auto">
            Paste any wallet address. Get an instant <span className="text-risk-low font-semibold">SAFE</span> /
            <span className="text-risk-medium font-semibold"> CAUTION</span> /
            <span className="text-risk-critical font-semibold"> DANGER</span> verdict, in plain English.
          </p>
        </div>

        <form onSubmit={submit} className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-2xl -z-10" />
          <Card className="p-2 flex gap-2 border-2 border-primary/30 bg-card/80 backdrop-blur-xl shadow-2xl">
            <Search className="w-5 h-5 text-muted-foreground self-center ml-3" />
            <Input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x… / bc1… / Solana address"
              className="border-0 bg-transparent text-base focus-visible:ring-0 font-mono"
            />
            <Button type="submit" size="lg" className="gap-2 font-semibold">
              Check <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Eye, t: "Pre-send check", d: "Vet any address before you click confirm." },
            { icon: ShieldAlert, t: "OFAC sanctions", d: "Real OFAC SDN list, synced daily." },
            { icon: Lock, t: "Read-only", d: "We never touch your wallet or funds." },
          ].map((f, i) => (
            <Card key={i} className="p-5 bg-card/40 border-border/50">
              <f.icon className="w-5 h-5 text-primary mb-2" />
              <div className="font-semibold text-sm">{f.t}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.d}</div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 text-xs text-muted-foreground">
          Need full investigation tools? <Link to="/dashboard" className="text-primary hover:underline">Open the Pro Console →</Link>
        </div>
      </main>
    </div>
  );
}

export function SafeCheckPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  if (!address) {
    return <Safe />;
  }
  return (
    <div className="min-h-screen bg-background">
      <SafeHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/safe")} className="gap-1 -ml-2">
          <ArrowLeft className="w-4 h-4" /> New check
        </Button>
        <SafeCheckRunner address={address} />
      </main>
    </div>
  );
}
