import { createContext, useContext, useState, type ReactNode } from "react";

export type ScenarioKey = "low" | "med" | "high";

export type Scenario = {
  key: ScenarioKey;
  label: string;
  // Demand multiplier applied to charging load
  demand: number;
  // Behavioral shift fraction: how much evening load is willing to move off-peak
  shift: number;
  // YoY growth multiplier applied to per-zone growth
  growth: number;
  // Adoption confidence multiplier for scheduling actions
  adoption: number;
  blurb: string;
};

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  low: {
    key: "low",
    label: "Low growth",
    demand: 0.78,
    shift: 0.22,
    growth: 0.6,
    adoption: 0.85,
    blurb: "Conservative EV uptake · slower fleet electrification",
  },
  med: {
    key: "med",
    label: "Medium growth",
    demand: 1,
    shift: 0.35,
    growth: 1,
    adoption: 1,
    blurb: "BESCOM baseline trajectory · current policy continues",
  },
  high: {
    key: "high",
    label: "High growth",
    demand: 1.35,
    shift: 0.48,
    growth: 1.45,
    adoption: 1.1,
    blurb: "Accelerated FAME-III + fleet mandates · aggressive uptake",
  },
};

type Ctx = {
  scenario: Scenario;
  setScenario: (k: ScenarioKey) => void;
};

const ScenarioContext = createContext<Ctx | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<ScenarioKey>("med");
  return (
    <ScenarioContext.Provider value={{ scenario: SCENARIOS[key], setScenario: setKey }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario must be used inside ScenarioProvider");
  return ctx;
}
