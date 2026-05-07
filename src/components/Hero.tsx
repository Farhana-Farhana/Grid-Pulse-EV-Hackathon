import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          BESCOM Hackathon · AI for EV Charging Optimization &amp; Infrastructure Planning
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          Predict the surge.{" "}
          <span className="text-grad-primary">Shape the load.</span>{" "}
          Place the chargers.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          A decision-support layer for Bengaluru's grid — forecasting EV charging
          demand by zone &amp; hour, recommending peak-shifting schedules, and
          siting new stations where demand, growth and grid headroom align.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <Link
            to="/operations"
            className="inline-flex items-center gap-2 rounded-md bg-grad-primary px-5 py-3 text-sm font-medium text-background shadow-glow transition hover:opacity-90"
          >
            Open the operations console →
          </Link>
          <Link
            to="/operations"
            hash="siting"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-5 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card/70"
          >
            See station recommendations
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { k: "Peak shift potential", v: "−27%", sub: "evening load" },
            { k: "Zones modeled", v: "12", sub: "Bengaluru wards" },
            { k: "Forecast horizon", v: "24h", sub: "rolling, hourly" },
            { k: "Priority sites", v: "5", sub: "next 90 days" },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-xl border border-border bg-card-grad p-4 shadow-card"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.k}
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
