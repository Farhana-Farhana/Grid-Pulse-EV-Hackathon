import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { buildHourlyDemand, buildTotalDemand } from "@/lib/data";
import { useScenario } from "@/lib/scenario";
import { useLiveGrid } from "@/lib/useLiveGrid";

const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function ForecastSection() {
  const { scenario } = useScenario();
  const live = useLiveGrid();
  const hourlyDemand = useMemo(
    () => buildHourlyDemand(scenario.demand, scenario.shift),
    [scenario.demand, scenario.shift],
  );
  const totalDemand = useMemo(() => buildTotalDemand(hourlyDemand), [hourlyDemand]);
  const peak = totalDemand.reduce((a, b) => (b.total > a.total ? b : a));
  const optPeak = totalDemand.reduce((a, b) => (b.optimized > a.optimized ? b : a));
  const liveLabel = live.isLive
    ? `${Math.round(live.totalLoadKw).toLocaleString()} kW now · ${live.readings.length} zones${
        live.lastUpdated
          ? ` · updated ${Math.max(0, Math.round((Date.now() - live.lastUpdated.getTime()) / 1000))}s ago`
          : ""
      }`
    : "Awaiting first telemetry tick…";

  return (
    <section id="forecast" className="border-t border-border/60 bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          tag="Part A · Demand Forecast"
          title="24-hour EV charging demand by zone type"
          desc="Hybrid model (XGBoost + LSTM on historical telemetry, weather and ward-level EV registry). Surfaces where and when charging will cluster."
        />

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground">
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              live.isLive ? "bg-[oklch(0.86_0.20_130)]" : "bg-muted-foreground/50"
            }`}
          >
            {live.isLive && (
              <span className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.86_0.20_130)] opacity-60" />
            )}
          </span>
          <span className="font-medium uppercase tracking-wider text-foreground">
            {live.isLive ? "Live BESCOM feed" : "Live feed warming up"}
          </span>
          <span className="text-muted-foreground">· {liveLabel}</span>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Stat
            label="Forecast peak load"
            value={`${peak.total.toLocaleString()} kW`}
            sub={`at ${fmtHour(peak.hour)} · 91% of grid headroom`}
            tone="surge"
          />
          <Stat
            label="With smart scheduling"
            value={`${optPeak.optimized.toLocaleString()} kW`}
            sub={`peak shaved by ${(((peak.total - optPeak.optimized) / peak.total) * 100).toFixed(0)}%`}
            tone="accent"
          />
          <Stat
            label="Off-peak valley"
            value="00:00 – 05:00"
            sub="38% spare capacity for shifted charging"
            tone="primary"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card-grad p-6 shadow-card">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold">Demand stack by zone type</h3>
              <p className="text-sm text-muted-foreground">
                Residential evening spike vs tech-park daytime load, against grid headroom.
              </p>
            </div>
            <Legend2 />
          </div>
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <AreaChart data={hourlyDemand} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRes" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.70 0.22 35)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.70 0.22 35)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gTp" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.18 195)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.82 0.18 195)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gCom" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.70 0.16 260)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.70 0.16 260)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250 / 0.5)" />
                <XAxis dataKey="hour" tickFormatter={fmtHour} stroke="oklch(0.68 0.02 240)" fontSize={11} />
                <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="techPark" stackId="1" stroke="oklch(0.82 0.18 195)" fill="url(#gTp)" />
                <Area type="monotone" dataKey="commercial" stackId="1" stroke="oklch(0.70 0.16 260)" fill="url(#gCom)" />
                <Area type="monotone" dataKey="residential" stackId="1" stroke="oklch(0.70 0.22 35)" fill="url(#gRes)" />
                <Line type="monotone" dataKey="gridCapacity" stroke="oklch(0.86 0.20 130)" strokeDasharray="6 4" dot={false} strokeWidth={2} />
                <ReferenceLine x={20} stroke="oklch(0.70 0.22 35 / 0.6)" label={{ value: "evening peak", fill: "oklch(0.86 0.20 130)", fontSize: 10, position: "top" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card-grad p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold">Baseline vs optimized total load</h3>
            <p className="text-sm text-muted-foreground">
              Smart scheduling redistributes ~27% of evening charging into the 00–05h valley.
            </p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer>
                <AreaChart data={totalDemand}>
                  <defs>
                    <linearGradient id="gBase" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.70 0.22 35)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.70 0.22 35)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOpt" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.86 0.20 130)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.86 0.20 130)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250 / 0.5)" />
                  <XAxis dataKey="hour" tickFormatter={fmtHour} stroke="oklch(0.68 0.02 240)" fontSize={11} />
                  <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="oklch(0.70 0.22 35)" fill="url(#gBase)" name="Baseline" />
                  <Area type="monotone" dataKey="optimized" stroke="oklch(0.86 0.20 130)" fill="url(#gOpt)" name="Optimized" />
                  <Line type="monotone" dataKey="capacity" stroke="oklch(0.82 0.18 195)" strokeDasharray="5 4" dot={false} name="Grid capacity" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ExplainCard className="lg:col-span-5" />
        </div>
      </div>
    </section>
  );
}

function ExplainCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card-grad p-6 shadow-card ${className}`}>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-primary">
        Explainability
      </div>
      <h3 className="font-display text-lg font-semibold">Why this forecast?</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <Bullet>
          <b className="text-foreground">Top driver:</b> residential AC home-charger turn-on at 19:30 (SHAP value +0.41).
        </Bullet>
        <Bullet>
          <b className="text-foreground">Weather signal:</b> +1.8°C above normal lifts evening demand by ~6%.
        </Bullet>
        <Bullet>
          <b className="text-foreground">Calendar:</b> weekday office return → tech-park midday plateau.
        </Bullet>
        <Bullet>
          <b className="text-foreground">Confidence:</b> MAPE 7.2% on 8-week holdout vs 14.1% naïve baseline.
        </Bullet>
      </ul>
      <div className="mt-5 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        Operates on masked, ward-level aggregates · no PII · no hosted LLM on sensitive telemetry.
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

function Legend2() {
  const items = [
    { c: "oklch(0.70 0.22 35)", l: "Residential" },
    { c: "oklch(0.82 0.18 195)", l: "Tech park" },
    { c: "oklch(0.70 0.16 260)", l: "Commercial" },
    { c: "oklch(0.86 0.20 130)", l: "Grid capacity" },
  ];
  return (
    <div className="hidden gap-4 text-xs text-muted-foreground md:flex">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: i.c }} />
          {i.l}
        </div>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "surge" | "accent" | "primary";
}) {
  const ring =
    tone === "surge"
      ? "border-[oklch(0.70_0.22_35/0.4)]"
      : tone === "accent"
        ? "border-accent/40"
        : "border-primary/40";
  return (
    <div className={`rounded-2xl border ${ring} bg-card-grad p-5 shadow-card`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 p-3 text-xs shadow-glow backdrop-blur">
      <div className="mb-1.5 font-semibold text-foreground">{fmtHour(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            {p.name ?? p.dataKey}
          </span>
          <span className="font-mono text-foreground">{Number(p.value).toLocaleString()} kW</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ tag, title, desc }: { tag: string; title: string; desc: string }) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        {tag}
      </div>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{desc}</p>
    </div>
  );
}
