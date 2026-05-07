import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { ForecastSection } from "@/components/ForecastSection";
import { ZoneMap } from "@/components/ZoneMap";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "GridPulse.EV — AI for BESCOM EV Charging Optimization" },
      {
        name: "description",
        content:
          "Decision-support layer for BESCOM: forecast EV charging demand and visualize grid stress across Bengaluru wards.",
      },
      { property: "og:title", content: "GridPulse.EV — AI for BESCOM EV Charging" },
      {
        property: "og:description",
        content:
          "Forecast demand. Visualize grid stress. A grid-aware AI decision-support layer for Bengaluru.",
      },
    ],
  }),
});

function Index() {
  return (
    <>
      <Hero />
      <ForecastSection />
      <ZoneMap />
      <section className="border-t border-border/60 bg-background py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Ready to act on the forecast?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Open the Operations Console to see scheduling recommendations and the
              top priority sites for new charging stations.
            </p>
          </div>
          <Link
            to="/operations"
            className="inline-flex items-center gap-2 rounded-lg bg-grad-primary px-5 py-3 text-sm font-medium text-background shadow-card transition hover:opacity-90"
          >
            Open Operations Console →
          </Link>
        </div>
      </section>
    </>
  );
}
