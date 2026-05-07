import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Ingest-Secret",
};

type Reading = {
  zone_id: string;
  load_kw: number;
  voltage?: number;
  frequency_hz?: number;
  recorded_at?: string;
  source?: string;
};

export const Route = createFileRoute("/api/public/ingest/grid")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          // Optional shared-secret check (only enforced if env var is set)
          const required = process.env.INGEST_SECRET;
          if (required) {
            const provided =
              request.headers.get("x-ingest-secret") ||
              request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
            if (provided !== required) {
              return new Response(JSON.stringify({ error: "unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...CORS },
              });
            }
          }

          const body = (await request.json()) as { readings?: Reading[] } | Reading;
          const readings: Reading[] = Array.isArray((body as any).readings)
            ? (body as any).readings
            : [body as Reading];

          // Validate
          const clean = readings
            .filter(
              (r) =>
                r &&
                typeof r.zone_id === "string" &&
                r.zone_id.length > 0 &&
                r.zone_id.length <= 32 &&
                typeof r.load_kw === "number" &&
                isFinite(r.load_kw) &&
                r.load_kw >= 0 &&
                r.load_kw < 100000,
            )
            .slice(0, 500)
            .map((r) => ({
              zone_id: r.zone_id,
              load_kw: r.load_kw,
              voltage: typeof r.voltage === "number" ? r.voltage : null,
              frequency_hz:
                typeof r.frequency_hz === "number" ? r.frequency_hz : null,
              recorded_at: r.recorded_at ?? new Date().toISOString(),
              source: r.source ?? "bescom-scada",
            }));

          if (clean.length === 0) {
            return new Response(JSON.stringify({ error: "no valid readings" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const { error } = await supabaseAdmin.from("grid_readings").insert(clean);
          if (error) throw error;

          return new Response(
            JSON.stringify({ ok: true, inserted: clean.length }),
            { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
          );
        } catch (e: any) {
          console.error("[ingest/grid] failed:", e?.message || e);
          return new Response(
            JSON.stringify({ error: e?.message ?? "ingest failed" }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }
      },
    },
  },
});
