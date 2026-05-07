import { createFileRoute, Link } from "@tanstack/react-router";
import { SchedulingSection } from "@/components/SchedulingSection";
import { SitingSection } from "@/components/SitingSection";

export const Route = createFileRoute("/operations")({
  component: OperationsPage,
  head: () => ({
    meta: [
      { title: "Operations Console — GridPulse.EV" },
      {
        name: "description",
        content:
          "Smart scheduling recommendations and station siting rankings for BESCOM EV charging operations.",
      },
      { property: "og:title", content: "Operations Console — GridPulse.EV" },
      {
        property: "og:description",
        content:
          "Per-zone scheduling actions and ranked priority sites for new charging stations across Bengaluru.",
      },
    ],
  }),
});

function OperationsPage() {
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
            Operations Console
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Actionable scheduling nudges and ranked priority sites — driven by the
            current scenario. Adjust the scenario in the banner above to see plans
            re-rank in real time.
          </p>
        </div>
      </section>
      <SchedulingSection />
      <SitingSection />
    </>
  );
}
