import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Simulates a fresh wave of BESCOM telemetry. Called by pg_cron every minute,
// or hit manually for testing. Generates realistic per-zone load curves keyed
// off the current hour so the dashboard always has live-feeling data.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function loadFor(type: string, hour: number, capacity: number): number {
  const evening = Math.exp(-Math.pow((hour - 20) / 2.2, 2));
  const midday = Math.exp(-Math.pow((hour - 13) / 3.5, 2));
  const morning = Math.exp(-Math.pow((hour - 8) / 2, 2));
  let frac = 0.25;
  if (type === "residential") frac = 0.18 + 0.6 * evening + 0.12 * morning;
  else if (type === "tech-park") frac = 0.15 + 0.55 * midday;
  else if (type === "commercial") frac = 0.2 + 0.4 * midday + 0.3 * evening;
  else if (type === "transit") frac = 0.25 + 0.35 * morning + 0.35 * evening;
  else frac = 0.22 + 0.4 * midday + 0.35 * evening;
  // jitter ±8%
  const jitter = 0.92 + Math.random() * 0.16;
  return Math.max(0, capacity * frac * jitter);
}

export const Route = createFileRoute("/api/public/ingest/simulate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async () => {
        try {
          const { data: zones, error: zErr } = await supabaseAdmin
            .from("zones")
            .select("id, type, grid_capacity_kw");
          if (zErr) throw zErr;
          if (!zones || zones.length === 0) {
            return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const now = new Date();
          const hour = now.getHours() + now.getMinutes() / 60;
          const rows = zones.map((z) => ({
            zone_id: z.id,
            load_kw: Number(loadFor(z.type, hour, Number(z.grid_capacity_kw)).toFixed(1)),
            voltage: Number((230 + (Math.random() - 0.5) * 6).toFixed(1)),
            frequency_hz: Number((50 + (Math.random() - 0.5) * 0.2).toFixed(2)),
            recorded_at: now.toISOString(),
            source: "bescom-scada-sim",
          }));

          const { error } = await supabaseAdmin.from("grid_readings").insert(rows);
          if (error) throw error;

          return new Response(
            JSON.stringify({ ok: true, inserted: rows.length, at: now.toISOString() }),
            { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
          );
        } catch (e: any) {
          console.error("[ingest/simulate] failed:", e?.message || e);
          return new Response(JSON.stringify({ error: e?.message ?? "failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
