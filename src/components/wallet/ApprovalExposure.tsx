import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mono } from "@/components/ui/mono";
import { KeyRound, ExternalLink } from "lucide-react";

export interface ApprovalItem {
  token: string;
  token_symbol: string | null;
  spender: string;
  spender_label: string | null;
  allowance: string;
  unlimited: boolean;
  risk: "high" | "medium" | "low";
  reason: string;
}

export interface ApprovalSummary {
  supported: boolean;
  total_spenders: number;
  unlimited_count: number;
  risky: ApprovalItem[];
}

const riskTone: Record<ApprovalItem["risk"], string> = {
  high: "text-risk-critical border-risk-critical/40 bg-risk-critical/10",
  medium: "text-risk-medium border-risk-medium/40 bg-risk-medium/10",
  low: "text-risk-low border-risk-low/40 bg-risk-low/10",
};

export default function ApprovalExposure({ approvals }: { approvals?: ApprovalSummary }) {
  if (!approvals?.supported) return null;

  const clean = approvals.risky.length === 0 && approvals.unlimited_count === 0;

  return (
    <Card
      className={`p-5 backdrop-blur-xl ${
        approvals.risky.some((a) => a.risk === "high")
          ? "border-risk-critical/40 bg-risk-critical/5"
          : "bg-card/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> Token approvals
        </h3>
        <div className="flex gap-2 shrink-0">
          <Badge variant="outline">{approvals.total_spenders} spenders</Badge>
          {approvals.unlimited_count > 0 && (
            <Badge variant="outline" className="text-risk-medium border-risk-medium/40">
              {approvals.unlimited_count} unlimited
            </Badge>
          )}
        </div>
      </div>

      {clean ? (
        <p className="text-sm text-muted-foreground">
          No unlimited or high-risk allowances outstanding. Nothing can move your tokens without
          asking you again.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            These contracts can move the listed tokens out of your wallet without a new signature.
            Revoke anything you don't recognise.
          </p>
          <div className="space-y-2">
            {approvals.risky.map((a) => (
              <div
                key={`${a.token}:${a.spender}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {a.token_symbol ?? "Unknown token"}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${riskTone[a.risk]}`}
                    >
                      {a.risk}
                    </span>
                    {a.unlimited && (
                      <Badge variant="outline" className="text-[10px]">
                        unlimited
                      </Badge>
                    )}
                  </div>
                  <Mono className="text-[11px] text-muted-foreground block truncate">
                    spender {a.spender}
                  </Mono>
                  <p className="text-xs text-muted-foreground mt-1">{a.reason}</p>
                </div>
                <a
                  href={`https://etherscan.io/address/${a.spender}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neon-cyan hover:underline flex items-center gap-1 shrink-0"
                >
                  Inspect <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Revoke approvals from your wallet's token-approval screen, or via a revoke tool. Rìan is
            read-only and never asks for a signature.
          </p>
        </>
      )}
    </Card>
  );
}
