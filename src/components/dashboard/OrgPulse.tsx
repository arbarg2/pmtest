import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, AlertTriangle, ShieldAlert, FolderOpen, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

interface RiskBucket {
  name: string;
  value: number;
  color: string;
}

interface DayPoint {
  day: string;
  hits: number;
}

const useCountUp = (target: number, duration = 900) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
};

const KpiTile: React.FC<{
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
  sublabel?: string;
}> = ({ label, value, Icon, tone, sublabel }) => {
  const animated = useCountUp(value);
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, hsl(var(--${tone})), transparent 60%)` }}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{animated}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `hsl(var(--${tone}) / 0.15)`, color: `hsl(var(--${tone}))` }}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrgPulse: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [riskBuckets, setRiskBuckets] = useState<RiskBucket[]>([]);
  const [weekHits, setWeekHits] = useState<DayPoint[]>([]);
  const [topSanctioned, setTopSanctioned] = useState<{ entity: string; count: number }[]>([]);
  const [kpis, setKpis] = useState({ total: 0, openCases: 0, sanctionsHits: 0, alerts7d: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Records (risk distribution + total + open cases)
        const { data: records } = await supabase
          .from("investigation_records")
          .select("id, risk_level, is_case, case_status, created_at")
          .eq("user_id", user.id);

        const recs = records ?? [];
        const buckets = { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<string, number>;
        recs.forEach((r) => {
          const lvl = (r.risk_level ?? "Low") as keyof typeof buckets;
          if (buckets[lvl] !== undefined) buckets[lvl]++;
        });
        setRiskBuckets([
          { name: "Low", value: buckets.Low, color: "hsl(var(--risk-low))" },
          { name: "Medium", value: buckets.Medium, color: "hsl(var(--risk-medium))" },
          { name: "High", value: buckets.High, color: "hsl(var(--risk-high))" },
          { name: "Critical", value: buckets.Critical, color: "hsl(var(--risk-critical))" },
        ]);

        const openCases = recs.filter(
          (r) => r.is_case && (r.case_status ?? "open") !== "closed",
        ).length;

        // Sanctions screening for user's records
        const recordIds = recs.map((r) => r.id);
        let sanctionsCount = 0;
        let topEntities: { entity: string; count: number }[] = [];

        if (recordIds.length) {
          const { data: sanctions } = await supabase
            .from("sanctions_screening")
            .select("entity_name, screening_date, lookup_record_id")
            .in("lookup_record_id", recordIds);
          sanctionsCount = sanctions?.length ?? 0;
          const map = new Map<string, number>();
          (sanctions ?? []).forEach((s: any) => {
            map.set(s.entity_name, (map.get(s.entity_name) ?? 0) + 1);
          });
          topEntities = Array.from(map.entries())
            .map(([entity, count]) => ({ entity, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }
        setTopSanctioned(topEntities);

        // 7-day weekly hits sparkline (records created per day)
        const days: DayPoint[] = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          days.push({ day: key.slice(5), hits: 0 });
        }
        recs.forEach((r) => {
          const key = r.created_at.slice(5, 10);
          const m = days.find((x) => x.day === key);
          if (m) m.hits++;
        });
        setWeekHits(days);

        // Alerts in last 7 days (via watched_wallets join)
        const { data: watched } = await supabase
          .from("watched_wallets")
          .select("id")
          .eq("user_id", user.id);
        let alerts7d = 0;
        const watchedIds = (watched ?? []).map((w) => w.id);
        if (watchedIds.length) {
          const since = new Date();
          since.setDate(since.getDate() - 7);
          const { count } = await supabase
            .from("watch_alerts")
            .select("id", { count: "exact", head: true })
            .in("watched_wallet_id", watchedIds)
            .gte("created_at", since.toISOString());
          alerts7d = count ?? 0;
        }

        setKpis({
          total: recs.length,
          openCases,
          sanctionsHits: sanctionsCount,
          alerts7d,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalRisk = riskBuckets.reduce((s, b) => s + b.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Org Pulse
          </h2>
          <span className="text-xs text-muted-foreground">Live overview of your portfolio</span>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Total investigations" value={kpis.total} Icon={Activity} tone="primary" />
          <KpiTile label="Open cases" value={kpis.openCases} Icon={FolderOpen} tone="risk-medium" />
          <KpiTile
            label="Sanctions hits"
            value={kpis.sanctionsHits}
            Icon={ShieldAlert}
            tone="risk-critical"
          />
          <KpiTile
            label="Alerts (7d)"
            value={kpis.alerts7d}
            Icon={AlertTriangle}
            tone="risk-high"
            sublabel="from watched wallets"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk donut */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {totalRisk === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                No investigations yet
              </div>
            ) : (
              <div className="relative h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskBuckets}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskBuckets.map((b) => (
                        <Cell key={b.name} fill={b.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalRisk}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      wallets
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {riskBuckets.map((b) => (
                <div key={b.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: b.color }} />
                  <span className="text-muted-foreground">{b.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{b.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity sparkline */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Investigations · last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekHits} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hits"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#pulseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top sanctioned exposures */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[hsl(var(--risk-critical))]" />
              Top sanctioned exposures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSanctioned.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No sanctions matches across your investigations.
              </div>
            ) : (
              <ul className="space-y-2">
                {topSanctioned.map((s, i) => (
                  <li key={s.entity} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium truncate" title={s.entity}>
                      {s.entity}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--risk-critical))]/15 text-[hsl(var(--risk-critical))] font-semibold">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrgPulse;
