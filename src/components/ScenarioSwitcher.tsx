import { SCENARIOS, useScenario, type ScenarioKey } from "@/lib/scenario";

const ORDER: ScenarioKey[] = ["low", "med", "high"];

export function ScenarioSwitcher({ compact = false }: { compact?: boolean }) {
  const { scenario, setScenario } = useScenario();
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 p-1 backdrop-blur ${
        compact ? "" : "shadow-card"
      }`}
    >
      {!compact && (
        <span className="pl-2 pr-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Scenario
        </span>
      )}
      {ORDER.map((k) => {
        const s = SCENARIOS[k];
        const active = scenario.key === k;
        return (
          <button
            key={k}
            onClick={() => setScenario(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-grad-primary text-background shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label.replace(" growth", "")}
          </button>
        );
      })}
    </div>
  );
}

export function ScenarioBanner() {
  const { scenario } = useScenario();
  return (
    <div className="sticky top-[65px] z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Adoption scenario
          </div>
          <div className="hidden text-sm text-foreground md:block">
            <span className="font-semibold">{scenario.label}</span>
            <span className="ml-2 text-muted-foreground">· {scenario.blurb}</span>
          </div>
        </div>
        <ScenarioSwitcher compact />
      </div>
    </div>
  );
}
