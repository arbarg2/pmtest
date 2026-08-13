import Seo from '@/components/Seo';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Wallet, Loader2, Copy, Check, Twitter, ArrowLeft, Sparkles, Activity, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { detectNetwork } from "@/services/walletValidation";
import HealthReportView, { type HealthReport } from "@/components/wallet/HealthReportView";
import QuickWatchButton from "@/components/wallet/QuickWatchButton";

export default function Health() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [copied, setCopied] = useState(false);

  const typed = address.trim();
  const typedNetwork = typed ? detectNetwork(typed) : undefined;
  const solanaTyped = typedNetwork === "solana";
  const invalidTyped = typed.length > 8 && !typedNetwork;

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
    const net = detectNetwork(target);
    if (!net) {
      toast.error("That doesn't look like a Bitcoin or Ethereum address.");
      return;
    }
    if (net === "solana") {
      toast.error("Solana isn't supported by the health check yet — use Safe Check instead.");
      return;
    }
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
      if (data?.error) throw new Error(data.message ?? data.error);
      setReport(data as HealthReport);
    } catch (e: any) {
      toast.error(e?.message ?? "Health check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reportUrl = report?.report_id
    ? `${window.location.origin}/health/report/${report.report_id}`
    : `${window.location.origin}/health`;

  const share = () => {
    if (!report) return;
    const text =
      report.verdict === "safe"
        ? `My wallet just got a clean bill of health on Rìan — 0 sanctioned counterparties across ${report.total_counterparties} addresses. Check yours:`
        : `I ran my wallet through Rìan's health check — risk score ${report.risk_score}/100. Check yours:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(reportUrl)}`,
      "_blank",
    );
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    toast.success(report?.report_id ? "Shareable report link copied" : "Link copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background bg-mesh relative overflow-hidden">
      <Seo
        title="Wallet Health Check — Scan Your Own Wallet"
        description="Scan your wallet's counterparty history for OFAC sanctions exposure, known scam and drainer addresses, mixers and risky token approvals."
        path="/health"
      />
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
            We walk the addresses your wallet has transacted with and flag OFAC-sanctioned entities,
            known scam and drainer addresses, mixers, and token approvals that are still live.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Bitcoin and Ethereum. Read-only — we never ask you to sign anything.
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
            <Button
              onClick={() => runScan()}
              disabled={loading || !typed || solanaTyped || invalidTyped}
              className="h-12 px-6"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
              Scan wallet
            </Button>
          </div>

          {invalidTyped && (
            <p className="text-xs text-risk-medium mt-2">
              That doesn't look like a Bitcoin or Ethereum address.
            </p>
          )}

          {solanaTyped && (
            <Alert className="mt-3 border-risk-medium/40 bg-risk-medium/5">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Solana isn't supported by the health check yet — the counterparty graph is Bitcoin
                and Ethereum only.{" "}
                <Link to={`/safe?address=${encodeURIComponent(typed)}`} className="text-neon-cyan underline">
                  Run a Safe Check on this address instead
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}

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
              Walking the transaction graph, screening counterparties and checking token approvals…
            </p>
          </div>
        )}

        {report && (
          <div className="mt-10 animate-in fade-in zoom-in-95 duration-500">
            <HealthReportView report={report} />

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <QuickWatchButton
                address={report.address}
                network={report.network}
                riskScore={report.risk_score}
                size="default"
                className="flex-1 h-11"
              />
              <Button onClick={share} className="flex-1 h-11 gap-2">
                <Twitter className="w-4 h-4" /> Share my report
              </Button>
              <Button variant="outline" onClick={copyLink} className="h-11 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy link
              </Button>
            </div>
            {report.report_id && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Anyone with the link can view this report — it contains the address and its verdict.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
