import { useMemo } from "react";
import { motion } from "framer-motion";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  buildHourlyDemand,
  buildTotalDemand,
  computeSiting,
  zones,
} from "@/lib/data";
import { useScenario } from "@/lib/scenario";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics Dashboard — GridPulse.EV" },
      {
        name: "description",
        content:
          "KPIs, peak-shift impact, CO₂ saved, and trend charts for BESCOM EV charging operations.",
      },
      { property: "og:title", content: "Analytics Dashboard — GridPulse.EV" },
      {
        property: "og:description",
        content:
          "Monitor peak-shift impact, CO₂ avoided, grid utilization and zone leaderboards across scenarios.",
      },
    ],
  }),
});

function AnalyticsPage() {
  const { scenario } = useScenario();

  const data = useMemo(() => {
    const hd = buildHourlyDemand(scenario.demand, scenario.shift);
    const total = buildTotalDemand(hd);

    // Peak comparison — measured during the evening window where the optimizer acts.
    const inEvening = (h: number) => h >= 18 && h <= 22;
    const peakBase = Math.max(
      ...total.filter((p) => inEvening(p.hour)).map((p) => p.total),
    );
    const peakOpt = Math.max(
      ...total.filter((p) => inEvening(p.hour)).map((p) => p.optimized),
    );

    // kWh shifted out of the evening peak window into off-peak hours.
    const shiftedKWh = total
      .filter((p) => inEvening(p.hour))
      .reduce((acc, p) => acc + Math.max(0, p.total - p.optimized), 0);

    // Tariff & emissions deltas between peak and off-peak (illustrative INR/kWh, kg/kWh).
    const tariffDelta = 3.4; // ₹/kWh saved by moving from peak to off-peak slab
    const co2Delta = 0.42; // kg CO2/kWh — peak coal-heavy vs off-peak cleaner mix
    const inrSaved = shiftedKWh * tariffDelta;
    const co2Saved = shiftedKWh * co2Delta;

    // Safe-hours = hours where load stays within grid capacity. Compare baseline vs optimized.
    const baseSafe = total.filter((p) => p.total <= p.capacity).length;
    const optSafe = total.filter((p) => p.optimized <= p.capacity).length;

    const ranked = computeSiting(scenario.demand, scenario.growth);
    return {
      total,
      peakBase,
      peakOpt,
      peakReduction: ((peakBase - peakOpt) / peakBase) * 100,
      shiftedKWh,
      baseSafe,
      optSafe,
      co2Saved,
      inrSaved,
      ranked,
    };
  }, [scenario]);

  // 12-week synthetic trend
  const trend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const baseline = 1100 + 80 * t + 60 * Math.sin(i / 1.6);
      const optimized = baseline * (1 - 0.18 - 0.08 * t * scenario.shift * 1.4);
      return { week: i + 1, baseline, optimized };
    });
  }, [scenario.shift]);

  return (
    <>
      <section className="border-b border-border/60 bg-background pt-12 pb-6">
        <div className="mx-auto max-w-7xl px-6">
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            ← Back to overview
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Analytics Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Outcome-level KPIs from the GridPulse optimizer — peak-shift impact,
            grid safety, and CO₂ avoided. All values react to the active scenario.
          </p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-6">
          {/* KPI grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi
              label="Peak load reduction"
              value={`−${data.peakReduction.toFixed(1)}%`}
              sub={`${Math.round(data.peakBase - data.peakOpt)} kW avoided`}
              accent
            />
            <Kpi
              label="CO₂ avoided"
              value={`${(data.co2Saved / 1000).toFixed(1)} t`}
              sub="per modeled day"
            />
            <Kpi
              label="Grid savings"
              value={`₹${(data.inrSaved / 100000).toFixed(2)}L`}
              sub="per modeled day"
            />
            <Kpi
              label="Safe-hours uplift"
              value={`${data.optSafe}/24`}
              sub={`${data.optSafe - data.baseSafe >= 0 ? "+" : ""}${data.optSafe - data.baseSafe} vs ${data.baseSafe}/24 baseline`}
            />
          </div>

          {/* Daily curve area */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card-grad p-6 shadow-card lg:col-span-2"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Daily load shape — baseline vs optimized
                </h2>
                <span className="text-xs text-muted-foreground">24h · kW</span>
              </div>
              <DailyChart data={data.total} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card-grad p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold">
                12-week peak trend
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Optimizer compounding effect as adoption grows.
              </p>
              <TrendChart data={trend} />
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <Legend color="oklch(0.55 0.04 250)" label="Baseline peak" />
                <Legend color="oklch(0.82 0.18 195)" label="Optimized peak" />
              </div>
            </motion.div>
          </div>

          {/* Zone leaderboard */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card-grad p-6 shadow-card"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Zone leaderboard
                </h2>
                <span className="text-xs text-muted-foreground">
                  by composite score
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {data.ranked.slice(0, 6).map((r, i) => (
                  <li key={r.zone.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{i + 1}
                        </span>
                        <span className="font-medium">{r.zone.name}</span>
                        <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {r.zone.type}
                        </span>
                      </span>
                      <span className="font-mono text-primary">
                        {r.total.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                      <div
                        className="h-full bg-grad-primary"
                        style={{ width: `${Math.min(100, r.total)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card-grad p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-semibold">
                Network composition
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {zones.length} wards modeled across BESCOM service area.
              </p>
              <div className="mt-5 space-y-3">
                {(
                  ["residential", "commercial", "mixed", "tech-park", "transit"] as const
                ).map((t) => {
                  const count = zones.filter((z) => z.type === t).length;
                  const stations = zones
                    .filter((z) => z.type === t)
                    .reduce((a, z) => a + z.existingStations, 0);
                  const pct = (count / zones.length) * 100;
                  return (
                    <div key={t}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-foreground">
                          {t.replace("-", " ")}{" "}
                          <span className="text-muted-foreground">
                            · {count} wards · {stations} stations
                          </span>
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                        <div
                          className="h-full bg-primary/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center">
                <Stat k="Wards" v={zones.length.toString()} />
                <Stat
                  k="Stations"
                  v={zones.reduce((a, z) => a + z.existingStations, 0).toString()}
                />
                <Stat
                  k="Capacity"
                  v={`${(
                    zones.reduce((a, z) => a + z.gridCapacity, 0) / 1000
                  ).toFixed(1)}MW`}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card-grad p-5 shadow-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 font-display text-3xl font-semibold ${
          accent ? "text-grad-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {k}
      </div>
      <div className="mt-0.5 font-display text-base font-semibold">{v}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function DailyChart({
  data,
}: {
  data: { hour: number; total: number; optimized: number; capacity: number }[];
}) {
  const w = 720;
  const h = 240;
  const pad = { l: 36, r: 12, t: 12, b: 22 };
  const maxY = Math.max(...data.map((d) => Math.max(d.total, d.capacity))) * 1.05;
  const x = (i: number) => pad.l + (i / 23) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / maxY) * (h - pad.t - pad.b);
  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = (vals: number[]) =>
    `${path(vals)} L ${x(23)} ${h - pad.b} L ${pad.l} ${h - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-auto w-full">
      <defs>
        <linearGradient id="aBase" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.55 0.04 250)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.55 0.04 250)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="aOpt" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.18 195)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.82 0.18 195)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + f * (h - pad.t - pad.b)}
          y2={pad.t + f * (h - pad.t - pad.b)}
          stroke="oklch(0.30 0.03 250 / 0.3)"
          strokeWidth="0.5"
        />
      ))}
      <path d={area(data.map((d) => d.total))} fill="url(#aBase)" />
      <path
        d={path(data.map((d) => d.total))}
        fill="none"
        stroke="oklch(0.55 0.04 250)"
        strokeWidth="1.5"
      />
      <path d={area(data.map((d) => d.optimized))} fill="url(#aOpt)" />
      <path
        d={path(data.map((d) => d.optimized))}
        fill="none"
        stroke="oklch(0.82 0.18 195)"
        strokeWidth="2"
      />
      <path
        d={path(data.map((d) => d.capacity))}
        fill="none"
        stroke="oklch(0.75 0.16 25)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {[0, 6, 12, 18, 23].map((hr) => (
        <text
          key={hr}
          x={x(hr)}
          y={h - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
        >
          {hr}h
        </text>
      ))}
      <g className="text-[10px]">
        <rect x={pad.l + 6} y={pad.t + 4} width="190" height="44" rx="6" fill="oklch(0.18 0.02 250 / 0.65)" />
        <circle cx={pad.l + 18} cy={pad.t + 16} r="3" fill="oklch(0.55 0.04 250)" />
        <text x={pad.l + 28} y={pad.t + 19} className="fill-foreground" fontSize="10">Baseline demand</text>
        <circle cx={pad.l + 18} cy={pad.t + 30} r="3" fill="oklch(0.82 0.18 195)" />
        <text x={pad.l + 28} y={pad.t + 33} className="fill-foreground" fontSize="10">Optimized</text>
        <line x1={pad.l + 14} x2={pad.l + 22} y1={pad.t + 42} y2={pad.t + 42} stroke="oklch(0.75 0.16 25)" strokeDasharray="3 2" />
        <text x={pad.l + 28} y={pad.t + 45} className="fill-foreground" fontSize="10">Grid capacity</text>
      </g>
    </svg>
  );
}

function TrendChart({
  data,
}: {
  data: { week: number; baseline: number; optimized: number }[];
}) {
  const w = 360;
  const h = 180;
  const pad = { l: 30, r: 8, t: 10, b: 22 };
  const maxY = Math.max(...data.map((d) => Math.max(d.baseline, d.optimized))) * 1.08;
  const minY = Math.min(...data.map((d) => Math.min(d.baseline, d.optimized))) * 0.92;
  const x = (i: number) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) =>
    pad.t + (1 - (v - minY) / (maxY - minY)) * (h - pad.t - pad.b);
  const line = (key: "baseline" | "optimized") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[key])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-auto w-full">
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + f * (h - pad.t - pad.b)}
          y2={pad.t + f * (h - pad.t - pad.b)}
          stroke="oklch(0.30 0.03 250 / 0.3)"
          strokeWidth="0.5"
        />
      ))}
      <path d={line("baseline")} fill="none" stroke="oklch(0.55 0.04 250)" strokeWidth="1.5" />
      <path d={line("optimized")} fill="none" stroke="oklch(0.82 0.18 195)" strokeWidth="2" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.optimized)} r="2.5" fill="oklch(0.82 0.18 195)" />
      ))}
      {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={h - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
        >
          W{data[i].week}
        </text>
      ))}
    </svg>
  );
}
