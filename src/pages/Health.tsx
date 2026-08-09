import Seo from '@/components/Seo';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Wallet, Loader2, CheckCircle2, AlertTriangle, ShieldAlert,
  Copy, Check, Twitter, ArrowLeft, Sparkles, Users, Activity, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mono } from "@/components/ui/mono";

type Verdict = "safe" | "caution" | "danger";

interface HealthReport {
  address: string;
  short: string;
  network: string;
  verdict: Verdict;
  risk_score: number;
  total_counterparties: number;
  total_transactions: number;
  first_seen: number | null;
  sanctioned_contacts: {
    address: string; entity_name: string | null; source_list: string | null;
    program: string | null; sent_txs: number; received_txs: number;
  }[];
  mixer_contacts: { address: string; label: string; sent: number; received: number }[];
  reasons: { type: string; severity: "low" | "medium" | "high"; text: string }[];
  record_id?: string | null;
}

const meta: Record<Verdict, { label: string; sub: string; tone: string; ring: string; glow: string; grad: string; icon: any }> = {
  safe: {
    label: "CLEAN BILL OF HEALTH",
    sub: "No sanctioned or mixer counterparties found in your history.",
    tone: "text-risk-low",
    ring: "border-risk-low/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-low)/0.6)]",
    grad: "from-risk-low/20 via-neon-lime/10 to-transparent",
    icon: CheckCircle2,
  },
  caution: {
    label: "SOME EXPOSURE FOUND",
    sub: "Worth reviewing before you use this wallet for anything sensitive.",
    tone: "text-risk-medium",
    ring: "border-risk-medium/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-medium)/0.6)]",
    grad: "from-risk-medium/20 via-neon-magenta/10 to-transparent",
    icon: AlertTriangle,
  },
  danger: {
    label: "HIGH-RISK EXPOSURE",
    sub: "This wallet has touched sanctioned or mixer addresses.",
    tone: "text-risk-critical",
    ring: "border-risk-critical/50",
    glow: "shadow-[0_0_100px_-10px_hsl(var(--risk-critical)/0.7)]",
    grad: "from-risk-critical/25 via-neon-magenta/10 to-transparent",
    icon: ShieldAlert,
  },
};

export default function Health() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [copied, setCopied] = useState(false);

  const connectWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("No browser wallet detected. Paste your address instead.");
      return;
    }
    try {
      setConnecting(true);
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) {
        setAddress(accounts[0]);
        await runScan(accounts[0]);
      }
    } catch {
      toast.error("Wallet connection cancelled.");
    } finally {
      setConnecting(false);
    }
  };

  const runScan = async (addr?: string) => {
    const target = (addr ?? address).trim();
    if (!target) return;
    if (!user) {
      toast.error("Sign in to run a wallet health check.");
      navigate("/auth");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("wallet-health-check", {
        body: { address: target },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data as HealthReport);
    } catch (e: any) {
      toast.error(e?.message ?? "Health check failed");
    } finally {
      setLoading(false);
    }
  };

  const share = () => {
    if (!report) return;
    const text =
      report.verdict === "safe"
        ? `My wallet just got a clean bill of health on Rìan — 0 sanctioned counterparties across ${report.total_counterparties} addresses. Check yours:`
        : `I ran my wallet through Rìan's health check — risk score ${report.risk_score}/100. Check yours:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin + "/health")}`,
      "_blank",
    );
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin + "/health");
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1800);
  };

  const M = report ? meta[report.verdict] : null;

  return (
      <Seo title="Wallet Health Check — Scan Your Own Wallet" description="Connect your wallet and scan its full counterparty history for sanctions exposure, mixers and risky addresses." path="/health" />
    <div className="min-h-screen bg-background bg-mesh relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-neon-cyan/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-neon-violet/10 blur-[120px]" />
      </div>

      <header className="relative border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
            <span className="font-bold tracking-tight">Rìan</span>
          </Link>
          <Link to="/safe">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Check another address
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 gap-1 border-primary/30">
            <Sparkles className="w-3 h-3" /> Wallet Health Check
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-aurora mb-3">
            Is your wallet clean?
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            We scan every address your wallet has ever transacted with and flag OFAC-sanctioned
            entities, mixers and drainer patterns.
          </p>
        </div>

        <Card className="p-5 md:p-6 border-glow bg-card/70 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              placeholder="0x… or bc1…"
              className="h-12 font-mono text-sm focus-visible:ring-primary/60"
            />
            <Button onClick={() => runScan()} disabled={loading || !address.trim()} className="h-12 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
              Scan wallet
            </Button>
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={connectWallet} disabled={connecting || loading} className="w-full h-12 gap-2">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Connect browser wallet
          </Button>
        </Card>

        {loading && (
          <div className="mt-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Walking the transaction graph and screening counterparties…
            </p>
          </div>
        )}

        {report && M && (
          <div className="mt-10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <Card className={`relative overflow-hidden p-8 border ${M.ring} ${M.glow} bg-card/80 backdrop-blur-xl`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${M.grad} pointer-events-none`} />
              <div className="relative flex flex-col items-center text-center gap-3">
                <M.icon className={`w-14 h-14 ${M.tone}`} />
                <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${M.tone}`}>{M.label}</h2>
                <p className="text-muted-foreground max-w-md">{M.sub}</p>
                <Mono className="text-xs text-muted-foreground">{report.address}</Mono>
                <div className="mt-2 text-5xl font-bold tabular-nums">{report.risk_score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Counterparties", value: report.total_counterparties },
                { icon: Activity, label: "Transactions", value: report.total_transactions },
                {
                  icon: Clock,
                  label: "Wallet age",
                  value: report.first_seen
                    ? `${Math.round((Date.now() - report.first_seen) / 86400000)}d`
                    : "—",
                },
              ].map((s) => (
                <Card key={s.label} className="p-4 bg-card/70 backdrop-blur-xl text-center">
                  <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                </Card>
              ))}
            </div>

            {report.sanctioned_contacts.length > 0 && (
              <Card className="p-5 border-risk-critical/40 bg-risk-critical/5">
                <h3 className="font-semibold text-risk-critical mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Sanctioned counterparties
                </h3>
                <div className="space-y-2">
                  {report.sanctioned_contacts.map((s) => (
                    <div key={s.address} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <Mono className="text-xs">{s.address}</Mono>
                        <div className="text-xs text-muted-foreground">
                          {s.entity_name ?? "Listed entity"} · {s.source_list ?? "OFAC"}
                        </div>
                      </div>
                      <Badge variant="destructive">{s.sent_txs} out / {s.received_txs} in</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {report.mixer_contacts.length > 0 && (
              <Card className="p-5 border-risk-high/40 bg-risk-high/5">
                <h3 className="font-semibold text-risk-high mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Mixer exposure
                </h3>
                <div className="space-y-2">
                  {report.mixer_contacts.map((m) => (
                    <div key={m.address} className="flex items-center justify-between gap-3 text-sm">
                      <Mono className="text-xs">{m.address}</Mono>
                      <Badge variant="outline">{m.label}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-5 bg-card/70 backdrop-blur-xl">
              <h3 className="font-semibold mb-3">What we found</h3>
              <ul className="space-y-2">
                {report.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        r.severity === "high"
                          ? "bg-risk-critical"
                          : r.severity === "medium"
                            ? "bg-risk-medium"
                            : "bg-risk-low"
                      }`}
                    />
                    <span className="text-muted-foreground">{r.text}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex gap-3">
              <Button onClick={share} className="flex-1 gap-2">
                <Twitter className="w-4 h-4" /> Share my report
              </Button>
              <Button variant="outline" onClick={copyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy link
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
