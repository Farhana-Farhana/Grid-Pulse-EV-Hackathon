
CREATE TABLE public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('residential','commercial','mixed','tech-park','transit')),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  grid_capacity_kw NUMERIC NOT NULL DEFAULT 0,
  existing_stations INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grid_readings (
  id BIGSERIAL PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  load_kw NUMERIC NOT NULL,
  voltage NUMERIC,
  frequency_hz NUMERIC,
  source TEXT
);
CREATE INDEX idx_grid_readings_zone_time ON public.grid_readings(zone_id, recorded_at DESC);

CREATE TABLE public.charging_sessions (
  id BIGSERIAL PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  station_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  energy_kwh NUMERIC NOT NULL DEFAULT 0,
  peak_kw NUMERIC,
  vehicle_type TEXT,
  operator TEXT
);
CREATE INDEX idx_sessions_zone_time ON public.charging_sessions(zone_id, started_at DESC);

CREATE TABLE public.station_status (
  station_id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('online','offline','degraded','maintenance','unknown')),
  connectors_total INT NOT NULL DEFAULT 0,
  connectors_in_use INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Public read grid_readings" ON public.grid_readings FOR SELECT USING (true);
CREATE POLICY "Public read charging_sessions" ON public.charging_sessions FOR SELECT USING (true);
CREATE POLICY "Public read station_status" ON public.station_status FOR SELECT USING (true);
