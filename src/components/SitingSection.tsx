import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { computeSiting, zones } from "@/lib/data";
import { useScenario } from "@/lib/scenario";

export function SitingSection() {
  const { scenario } = useScenario();
  const ranked = useMemo(
    () => computeSiting(scenario.demand, scenario.growth),
    [scenario.demand, scenario.growth],
  );
  const [selectedId, setSelectedId] = useState<string>(ranked[0].zone.id);
  const selected =
    ranked.find((r) => r.zone.id === selectedId) ?? ranked[0];

  useEffect(() => {
    if (!ranked.find((r) => r.zone.id === selectedId)) {
      setSelectedId(ranked[0].zone.id);
    }
  }, [ranked, selectedId]);

  return (
    <section id="siting" className="border-t border-border/60 bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Part B · Infrastructure Siting
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Where to build the next 5 charging stations
          </h2>
          <p className="mt-3 text-muted-foreground">
            Zones scored on demand density, supply gap, grid headroom, and growth trajectory —
            then ranked. Click a zone for the full breakdown.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Map */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card-grad shadow-card">
              <div className="absolute inset-0 grid-bg opacity-50" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                {/* faux road network */}
                {[20, 40, 60, 80].map((y) => (
                  <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="oklch(0.30 0.03 250 / 0.4)" strokeWidth="0.15" />
                ))}
                {[20, 40, 60, 80].map((x) => (
                  <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="oklch(0.30 0.03 250 / 0.4)" strokeWidth="0.15" />
                ))}
                <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.82 0.18 195 / 0.15)" strokeWidth="0.2" strokeDasharray="0.6 0.4" />
              </svg>

              {ranked.map((r, idx) => {
                const isTop5 = idx < 5;
                const isSel = selected.zone.id === r.zone.id;
                const size = 8 + (r.total / 100) * 22;
                return (
                  <button
                    key={r.zone.id}
                    onClick={() => setSelectedId(r.zone.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${r.zone.lng}%`, top: `${r.zone.lat}%` }}
                  >
                    <span
                      className={`block rounded-full transition ${
                        isTop5 ? "bg-grad-primary" : "bg-primary/30"
                      } ${isSel ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
                      style={{ width: size, height: size }}
                    />
                    {isTop5 && (
                      <span className="pulse-dot absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" />
                    )}
                    <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                      {r.zone.name}
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-3 rounded-md border border-border bg-background/70 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
                Bengaluru · 12 wards modeled
              </div>
              <div className="absolute right-3 top-3 flex items-center gap-3 rounded-md border border-border bg-background/70 px-3 py-1.5 text-[10px] backdrop-blur">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-grad-primary" />priority</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary/30" />monitor</span>
              </div>
            </div>
          </div>

          {/* Ranking + detail */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border bg-card-grad p-5 shadow-card">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-display text-lg font-semibold">Top 5 priority sites</h3>
                <span className="text-xs text-muted-foreground">next 90 days</span>
              </div>
              <ol className="space-y-1.5">
                {ranked.slice(0, 5).map((r, i) => {
                  const sel = selected.zone.id === r.zone.id;
                  return (
                    <li key={r.zone.id}>
                      <button
                        onClick={() => setSelectedId(r.zone.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                          sel
                            ? "border-primary/60 bg-primary/10"
                            : "border-border/60 bg-background/30 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                          <span className="font-medium">{r.zone.name}</span>
                          <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {r.zone.type}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-primary">{r.total.toFixed(0)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <motion.div
              key={selected.zone.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card-grad p-5 shadow-card"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl font-semibold">{selected.zone.name}</h3>
                <span className="font-mono text-sm text-muted-foreground">
                  composite {selected.total.toFixed(1)}/100
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{selected.rationale}</p>

              <div className="mt-5 space-y-3">
                <Bar label="Demand density" value={selected.demandScore} weight={35} />
                <Bar label="Supply gap" value={selected.gapScore} weight={30} />
                <Bar label="Grid headroom" value={selected.gridScore} weight={20} />
                <Bar label="Growth trajectory" value={selected.growthScore} weight={15} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center">
                <Mini k="Existing" v={selected.zone.existingStations.toString()} />
                <Mini k="Headroom" v={`${selected.zone.gridCapacity}kW`} />
                <Mini k="Growth" v={`+${selected.zone.growth}%`} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Full table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card-grad shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Zone</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-right font-medium">Demand</th>
                <th className="px-5 py-3 text-right font-medium">Gap</th>
                <th className="px-5 py-3 text-right font-medium">Grid</th>
                <th className="px-5 py-3 text-right font-medium">Growth</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr
                  key={r.zone.id}
                  className={`border-t border-border/40 transition hover:bg-background/30 ${
                    i < 5 ? "" : "text-muted-foreground"
                  }`}
                >
                  <td className="px-5 py-3 font-medium">{r.zone.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.zone.type}</td>
                  <td className="px-5 py-3 text-right font-mono">{r.demandScore.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right font-mono">{r.gapScore.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right font-mono">{r.gridScore.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right font-mono">{r.growthScore.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-foreground">
                    {r.total.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Synthetic dataset · {zones.length} wards · weights tunable by BESCOM planners.
        </p>
      </div>
    </section>
  );
}

function Bar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {label} <span className="text-foreground/40">· w={weight}%</span>
        </span>
        <span className="font-mono text-foreground">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full bg-grad-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5 font-display text-base font-semibold">{v}</div>
    </div>
  );
}
