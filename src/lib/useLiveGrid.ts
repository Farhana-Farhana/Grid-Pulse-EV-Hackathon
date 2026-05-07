import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LiveReading = {
  zone_id: string;
  load_kw: number;
  recorded_at: string;
  voltage: number | null;
  frequency_hz: number | null;
};

export type LiveGridState = {
  isLive: boolean;
  readings: LiveReading[]; // latest reading per zone
  totalLoadKw: number;
  lastUpdated: Date | null;
};

// Pulls the most recent grid reading per zone, then subscribes to inserts.
// Falls back to isLive=false when the DB is empty so charts can render synthetic data.
export function useLiveGrid(): LiveGridState {
  const [readings, setReadings] = useState<LiveReading[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLatest() {
      // Pull last 500 rows, take latest per zone client-side (small N).
      const { data, error } = await supabase
        .from("grid_readings")
        .select("zone_id, load_kw, recorded_at, voltage, frequency_hz")
        .order("recorded_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) {
        console.warn("[useLiveGrid] read failed:", error.message);
        return;
      }
      const seen = new Map<string, LiveReading>();
      for (const r of data ?? []) {
        if (!seen.has(r.zone_id)) {
          seen.set(r.zone_id, {
            zone_id: r.zone_id,
            load_kw: Number(r.load_kw),
            recorded_at: r.recorded_at,
            voltage: r.voltage === null ? null : Number(r.voltage),
            frequency_hz:
              r.frequency_hz === null ? null : Number(r.frequency_hz),
          });
        }
      }
      const arr = Array.from(seen.values());
      setReadings(arr);
      if (arr.length) {
        const newest = arr.reduce((a, b) =>
          a.recorded_at > b.recorded_at ? a : b,
        );
        setLastUpdated(new Date(newest.recorded_at));
      }
    }

    loadLatest();

    const channel = supabase
      .channel("grid_readings_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "grid_readings" },
        (payload) => {
          const r = payload.new as LiveReading;
          setReadings((prev) => {
            const next = prev.filter((p) => p.zone_id !== r.zone_id);
            next.push({
              zone_id: r.zone_id,
              load_kw: Number(r.load_kw),
              recorded_at: r.recorded_at,
              voltage: r.voltage === null ? null : Number(r.voltage),
              frequency_hz:
                r.frequency_hz === null ? null : Number(r.frequency_hz),
            });
            return next;
          });
          setLastUpdated(new Date(r.recorded_at));
        },
      )
      .subscribe();

    // Light refresh every 60s in case realtime drops
    const t = setInterval(loadLatest, 60000);

    return () => {
      cancelled = true;
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  const totalLoadKw = readings.reduce((s, r) => s + r.load_kw, 0);
  return {
    isLive: readings.length > 0,
    readings,
    totalLoadKw,
    lastUpdated,
  };
}
