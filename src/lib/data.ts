// Synthetic Bengaluru zone + grid data for BESCOM EV decision-support demo.
// All values are illustrative. Demand in kW, capacity in kW, distances in km.

export type Zone = {
  id: string;
  name: string;
  type: "residential" | "commercial" | "mixed" | "tech-park" | "transit";
  evDensity: number; // EVs per sq km (relative)
  growth: number; // YoY % growth
  gridCapacity: number; // available headroom kW
  existingStations: number;
  lat: number; // 0-100 normalized for our SVG canvas
  lng: number;
};

export const zones: Zone[] = [
  { id: "kor", name: "Koramangala", type: "mixed", evDensity: 92, growth: 38, gridCapacity: 420, existingStations: 6, lat: 62, lng: 58 },
  { id: "indi", name: "Indiranagar", type: "mixed", evDensity: 88, growth: 34, gridCapacity: 380, existingStations: 5, lat: 48, lng: 62 },
  { id: "whf", name: "Whitefield", type: "tech-park", evDensity: 96, growth: 46, gridCapacity: 720, existingStations: 8, lat: 42, lng: 86 },
  { id: "ebb", name: "Electronic City", type: "tech-park", evDensity: 84, growth: 42, gridCapacity: 680, existingStations: 7, lat: 88, lng: 64 },
  { id: "hsr", name: "HSR Layout", type: "residential", evDensity: 78, growth: 40, gridCapacity: 310, existingStations: 3, lat: 70, lng: 60 },
  { id: "jpn", name: "Jayanagar", type: "residential", evDensity: 64, growth: 28, gridCapacity: 290, existingStations: 4, lat: 70, lng: 44 },
  { id: "mly", name: "Malleshwaram", type: "residential", evDensity: 52, growth: 22, gridCapacity: 260, existingStations: 3, lat: 36, lng: 36 },
  { id: "yhk", name: "Yelahanka", type: "mixed", evDensity: 58, growth: 36, gridCapacity: 340, existingStations: 2, lat: 14, lng: 46 },
  { id: "hbr", name: "Hebbal", type: "transit", evDensity: 70, growth: 32, gridCapacity: 410, existingStations: 4, lat: 22, lng: 52 },
  { id: "btn", name: "Bannerghatta Rd", type: "mixed", evDensity: 74, growth: 35, gridCapacity: 360, existingStations: 3, lat: 80, lng: 50 },
  { id: "mgr", name: "MG Road", type: "commercial", evDensity: 68, growth: 18, gridCapacity: 300, existingStations: 5, lat: 50, lng: 52 },
  { id: "rrn", name: "Rajarajeshwari Nagar", type: "residential", evDensity: 44, growth: 30, gridCapacity: 280, existingStations: 1, lat: 64, lng: 24 },
];

// 24h demand curve (kW) — typical evening peak in residential, daytime in tech parks.
export type HourlyPoint = {
  hour: number;
  residential: number;
  techPark: number;
  commercial: number;
  gridCapacity: number;
  optimized: number;
};

const baseGrid = 1800;

export function buildHourlyDemand(
  demandMul = 1,
  shiftFrac = 0.35,
): HourlyPoint[] {
  return Array.from({ length: 24 }, (_, h) => {
    const res =
      (140 +
        180 * Math.exp(-Math.pow((h - 8) / 2, 2)) +
        620 * Math.exp(-Math.pow((h - 20) / 2.2, 2))) *
      demandMul;
    const tp = (80 + 520 * Math.exp(-Math.pow((h - 13) / 3.5, 2))) * demandMul;
    const com =
      (60 +
        260 * Math.exp(-Math.pow((h - 12) / 3, 2)) +
        180 * Math.exp(-Math.pow((h - 19) / 2.5, 2))) *
      demandMul;

    const cap = baseGrid - 350 * Math.exp(-Math.pow((h - 20) / 2.5, 2));

    let optimized = res + tp + com;
    if (h >= 18 && h <= 22) optimized -= res * shiftFrac;
    if (h >= 0 && h <= 5) optimized += 220 * demandMul * (shiftFrac / 0.35);
    if (h >= 11 && h <= 15) optimized += 90 * demandMul * (shiftFrac / 0.35);

    return {
      hour: h,
      residential: Math.round(res),
      techPark: Math.round(tp),
      commercial: Math.round(com),
      gridCapacity: Math.round(cap),
      optimized: Math.round(optimized),
    };
  });
}

export function buildTotalDemand(hd: HourlyPoint[]) {
  return hd.map((p) => ({
    hour: p.hour,
    total: p.residential + p.techPark + p.commercial,
    optimized: p.optimized,
    capacity: p.gridCapacity,
  }));
}

// Default (medium-scenario) precomputed series
export const hourlyDemand: HourlyPoint[] = buildHourlyDemand();
export const totalDemand = buildTotalDemand(hourlyDemand);

// Siting score = weighted blend (explainable).
export type SitingScore = {
  zone: Zone;
  demandScore: number;
  gapScore: number;
  gridScore: number;
  growthScore: number;
  total: number;
  rationale: string;
};

export function computeSiting(
  demandMul = 1,
  growthMul = 1,
): SitingScore[] {
  const scaled = zones.map((z) => ({
    ...z,
    evDensity: z.evDensity * demandMul,
    growth: z.growth * growthMul,
  }));
  const max = (k: keyof Zone) => Math.max(...scaled.map((z) => Number(z[k])));
  const maxDensity = max("evDensity");
  const maxCap = max("gridCapacity");
  const maxGrowth = max("growth");

  return scaled
    .map((z) => {
      const demandScore = (z.evDensity / maxDensity) * 100;
      // gap = high density / low existing stations
      const gapScore = Math.min(
        100,
        (z.evDensity / Math.max(1, z.existingStations)) * 0.9,
      );
      const gridScore = (z.gridCapacity / maxCap) * 100;
      const growthScore = (z.growth / maxGrowth) * 100;
      const total =
        demandScore * 0.35 +
        gapScore * 0.3 +
        gridScore * 0.2 +
        growthScore * 0.15;

      const drivers: string[] = [];
      if (gapScore > 70) drivers.push(`under-served (${z.existingStations} stations vs density ${z.evDensity.toFixed(0)})`);
      if (growthScore > 80) drivers.push(`high YoY growth +${z.growth.toFixed(0)}%`);
      if (gridScore > 75) drivers.push(`strong grid headroom ${z.gridCapacity}kW`);
      if (demandScore > 85) drivers.push(`top demand zone`);
      const rationale =
        drivers.length > 0
          ? drivers.join(" · ")
          : `balanced profile across demand & grid`;

      return { zone: z, demandScore, gapScore, gridScore, growthScore, total, rationale };
    })
    .sort((a, b) => b.total - a.total);
}

export const schedulingRecommendations = [
  {
    zone: "Koramangala",
    window: "20:00 – 22:00",
    action: "Shift 40% of residential charging to 00:00 – 05:00",
    impact: "−180 kW peak, +₹2.1L/mo grid savings",
    confidence: 0.91,
  },
  {
    zone: "HSR Layout",
    window: "19:00 – 21:30",
    action: "Dynamic tariff nudge: −18% off-peak rate",
    impact: "−110 kW peak, 62% adoption forecast",
    confidence: 0.84,
  },
  {
    zone: "Whitefield",
    window: "13:00 – 16:00",
    action: "Encourage workplace top-up charging (solar window)",
    impact: "+9% renewables utilization",
    confidence: 0.88,
  },
  {
    zone: "Indiranagar",
    window: "20:30 – 22:00",
    action: "Stagger fleet charging in 3 batches",
    impact: "−95 kW peak, no user-perceived delay",
    confidence: 0.79,
  },
];
