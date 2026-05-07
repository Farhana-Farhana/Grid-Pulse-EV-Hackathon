import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { zones, computeSiting, buildHourlyDemand, type Zone } from "@/lib/data";
import { useScenario } from "@/lib/scenario";

type Metric = "siting" | "stress" | "growth";

const METRICS: { key: Metric; label: string; hint: string }[] = [
  { key: "siting", label: "Siting priority", hint: "Composite score · higher = better candidate" },
  { key: "stress", label: "Grid stress", hint: "Peak demand vs available headroom" },
  { key: "growth", label: "EV growth", hint: "Year-over-year adoption velocity" },
];

export function ZoneMap() {
  const { scenario } = useScenario();
  const [metric, setMetric] = useState<Metric>("siting");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const ranked = useMemo(
    () => computeSiting(scenario.demand, scenario.growth),
    [scenario.demand, scenario.growth],
  );
  const rankMap = useMemo(() => {
    const m = new Map<string, { rank: number; total: number; rationale: string }>();
    ranked.forEach((r, i) =>
      m.set(r.zone.id, { rank: i + 1, total: r.total, rationale: r.rationale }),
    );
    return m;
  }, [ranked]);

  const stressMap = useMemo(() => {
    const m = new Map<string, number>();
    zones.forEach((z) => {
      // synthetic peak load proxy from density × scenario demand vs grid headroom
      const peak = z.evDensity * 7.5 * scenario.demand;
      m.set(z.id, Math.min(1.2, peak / z.gridCapacity));
    });
    return m;
  }, [scenario.demand]);

  const valueFor = (z: Zone) => {
    if (metric === "siting") {
      const r = rankMap.get(z.id);
      return r ? r.total / 100 : 0;
    }
    if (metric === "stress") return stressMap.get(z.id) ?? 0;
    return Math.min(1, (z.growth * scenario.growth) / 50);
  };

  const activeId = hoverId ?? pinnedId;
  const active = zones.find((z) => z.id === activeId) ?? null;
  const activeStress = active ? stressMap.get(active.id) ?? 0 : 0;
  const activeRank = active ? rankMap.get(active.id) : undefined;

  const activeHourly = useMemo(() => {
    if (!active) return [];
    const hd = buildHourlyDemand(scenario.demand, scenario.shift);
    // Blend per-zone signature based on zone type
    return hd.map((p) => {
      let v = p.residential;
      if (active.type === "tech-park") v = p.techPark;
      else if (active.type === "commercial") v = p.commercial;
      else if (active.type === "mixed") v = (p.residential + p.commercial) / 2;
      else if (active.type === "transit") v = (p.commercial + p.techPark) / 2;
      const scale = active.evDensity / 80;
      return { hour: p.hour, value: v * scale };
    });
  }, [active, scenario.demand, scenario.shift]);

  const peakHour = activeHourly.reduce(
    (best, p) => (p.value > best.value ? p : best),
    { hour: 0, value: 0 },
  );

  return (
    <section id="map" className="border-t border-border/60 bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Spatial View · Bengaluru Wards
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Hover a zone to inspect · click to pin
            </h2>
            <p className="mt-3 text-muted-foreground">
              A spatial overlay on top of the model outputs. Switch the lens to compare
              siting priority, grid stress, and adoption velocity across wards.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/60 p-1">
            {METRICS.map((m) => {
              const active = metric === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-grad-primary text-background shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          {METRICS.find((m) => m.key === metric)?.hint}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* MAP */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card-grad p-4 shadow-card">
            <svg
              viewBox="0 0 100 100"
              className="aspect-square w-full"
              onMouseLeave={() => setHoverId(null)}
            >
              <defs>
                <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
                  <stop offset="0%" stopColor="oklch(0.30 0.04 250 / 0.45)" />
                  <stop offset="100%" stopColor="oklch(0.16 0.02 250 / 0)" />
                </radialGradient>
                <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path
                    d="M 6 0 L 0 0 0 6"
                    fill="none"
                    stroke="oklch(0.35 0.02 250 / 0.18)"
                    strokeWidth="0.15"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#bgGlow)" />
              <rect width="100" height="100" fill="url(#grid)" />

              {/* faux ring road */}
              <ellipse
                cx="52"
                cy="52"
                rx="38"
                ry="34"
                fill="none"
                stroke="oklch(0.55 0.04 250 / 0.35)"
                strokeWidth="0.4"
                strokeDasharray="1.2 1.2"
              />
              <ellipse
                cx="52"
                cy="52"
                rx="22"
                ry="20"
                fill="none"
                stroke="oklch(0.55 0.04 250 / 0.25)"
                strokeWidth="0.3"
                strokeDasharray="0.8 1.4"
              />

              {/* zone bubbles */}
              {zones.map((z) => {
                const v = Math.max(0, Math.min(1, valueFor(z)));
                const r = 2.4 + v * 5.2;
                const isActive = activeId === z.id;
                const isPinned = pinnedId === z.id;
                const color =
                  metric === "stress"
                    ? colorForStress(v)
                    : metric === "growth"
                      ? "oklch(0.78 0.16 145)"
                      : "oklch(0.82 0.18 195)";
                return (
                  <g
                    key={z.id}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoverId(z.id)}
                    onClick={() => setPinnedId(isPinned ? null : z.id)}
                  >
                    {/* halo */}
                    <circle
                      cx={z.lng}
                      cy={z.lat}
                      r={r + 2.2}
                      fill={color}
                      opacity={isActive ? 0.28 : 0.12}
                    />
                    <circle
                      cx={z.lng}
                      cy={z.lat}
                      r={r}
                      fill={color}
                      opacity={0.85}
                      stroke={isPinned ? "oklch(0.95 0 0)" : "oklch(0.95 0 0 / 0.4)"}
                      strokeWidth={isPinned ? 0.5 : 0.2}
                    />
                    {(isActive || metric === "siting") && (
                      <text
                        x={z.lng}
                        y={z.lat - r - 1.2}
                        textAnchor="middle"
                        fontSize="2.4"
                        fill="oklch(0.95 0 0)"
                        style={{ paintOrder: "stroke", fontFamily: "inherit" }}
                        stroke="oklch(0.12 0.02 250 / 0.7)"
                        strokeWidth="0.6"
                      >
                        {metric === "siting" && rankMap.get(z.id)
                          ? `#${rankMap.get(z.id)!.rank} ${z.name}`
                          : z.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-[10px] backdrop-blur">
              <span className="uppercase tracking-widest text-muted-foreground">
                {metric === "stress" ? "Headroom" : "Score"}
              </span>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[oklch(0.75_0.15_145)]" />
                <span className="text-muted-foreground">low</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[oklch(0.82_0.18_85)]" />
                <span className="text-muted-foreground">med</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[oklch(0.68_0.22_25)]" />
                <span className="text-muted-foreground">high</span>
              </div>
            </div>
            {pinnedId && (
              <button
                onClick={() => setPinnedId(null)}
                className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur hover:text-foreground"
              >
                Unpin
              </button>
            )}
          </div>

          {/* DETAIL PANEL */}
          <motion.div
            key={active?.id ?? "empty"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border bg-card-grad p-6 shadow-card"
          >
            {!active ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <div className="mb-3 h-10 w-10 rounded-full border border-dashed border-border" />
                Hover a zone bubble to inspect its forecast, grid stress, and siting rank.
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {active.type.replace("-", " ")}
                    </div>
                    <h3 className="mt-1 font-display text-xl font-semibold">{active.name}</h3>
                  </div>
                  {activeRank && (
                    <div className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Rank #{activeRank.rank}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="EV density" value={active.evDensity.toFixed(0)} />
                  <Stat label="Grid kW" value={active.gridCapacity.toString()} />
                  <Stat label="Stations" value={active.existingStations.toString()} />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="uppercase tracking-widest text-muted-foreground">
                      Grid stress
                    </span>
                    <span className="font-mono text-foreground">
                      {(activeStress * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, activeStress * 100)}%`,
                        background: colorForStress(activeStress),
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="uppercase tracking-widest text-muted-foreground">
                      24h demand · peak {String(peakHour.hour).padStart(2, "0")}:00
                    </span>
                    <span className="font-mono text-foreground">
                      {Math.round(peakHour.value)} kW
                    </span>
                  </div>
                  <Sparkline points={activeHourly.map((p) => p.value)} />
                </div>

                {activeRank && (
                  <div className="mt-5 rounded-lg border border-border/60 bg-background/40 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Why this rank
                    </div>
                    <div className="mt-1 text-sm text-foreground">{activeRank.rationale}</div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2">
      <div className="font-mono text-base font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.18 195 / 0.5)" />
          <stop offset="100%" stopColor="oklch(0.82 0.18 195 / 0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={d} stroke="oklch(0.82 0.18 195)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function colorForStress(v: number) {
  // 0 → green, 0.6 → amber, 1+ → red
  if (v < 0.45) return "oklch(0.75 0.15 145)";
  if (v < 0.8) return "oklch(0.82 0.18 85)";
  return "oklch(0.68 0.22 25)";
}
