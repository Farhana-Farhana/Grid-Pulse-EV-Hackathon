import { useMemo } from "react";
import { motion } from "framer-motion";
import { schedulingRecommendations } from "@/lib/data";
import { useScenario } from "@/lib/scenario";

export function SchedulingSection() {
  const { scenario } = useScenario();
  const recs = useMemo(
    () =>
      schedulingRecommendations.map((r) => {
        // Scale impact peak (kW) and confidence by scenario
        const scaled = r.impact.replace(/−(\d+)\s*kW/, (_, n) => {
          const v = Math.round(Number(n) * scenario.demand);
          return `−${v} kW`;
        });
        const conf = Math.max(0.5, Math.min(0.98, r.confidence * scenario.adoption));
        return { ...r, impact: scaled, confidence: conf };
      }),
    [scenario.demand, scenario.adoption],
  );
  return (
    <section id="scheduling" className="border-t border-border/60 bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Part A · Smart Scheduling
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Nudge charging into the grid's quiet hours
          </h2>
          <p className="mt-3 text-muted-foreground">
            A constrained optimizer (MILP) generates per-zone scheduling actions that
            respect grid headroom, user comfort, and adoption probability.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {recs.map((r, i) => (
            <motion.div
              key={r.zone}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card-grad p-6 shadow-card transition hover:border-primary/50"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {r.window}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold">{r.zone}</h3>
                </div>
                <ConfidenceRing v={r.confidence} />
              </div>

              <p className="relative mt-4 text-sm text-foreground">{r.action}</p>

              <div className="relative mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <div className="text-xs text-muted-foreground">Projected impact</div>
                <div className="text-sm font-medium text-accent">{r.impact}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card-grad p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold">Optimizer constraints</h3>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            {[
              ["Grid headroom", "≤ 85% transformer rated load per ward"],
              ["User comfort", "≥ 80% SoC by user-declared departure"],
              ["Tariff fairness", "Off-peak nudge ≤ 25% rate delta"],
              ["Renewables", "Bias toward solar window 11–15h"],
              ["Adoption realism", "Behavioral elasticity model β=0.42"],
              ["Equity", "Min 1 priority site per low-income ward"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="mt-1 text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ConfidenceRing({ v }: { v: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} stroke="oklch(0.30 0.03 250 / 0.6)" strokeWidth="3" fill="none" />
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke="oklch(0.82 0.18 195)"
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-[11px] font-semibold">{Math.round(v * 100)}</span>
    </div>
  );
}
