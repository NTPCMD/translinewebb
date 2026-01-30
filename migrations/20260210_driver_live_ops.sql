-- Migration: Driver Live Ops tables, views, and policies

-- Driver presence heartbeat
CREATE TABLE IF NOT EXISTS public.driver_presence (
  driver_id uuid PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Driver status events
CREATE TABLE IF NOT EXISTS public.driver_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  state text NOT NULL CHECK (state IN ('online', 'offline', 'break', 'driving', 'idle')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_driver_status_events_driver_started
  ON public.driver_status_events(driver_id, started_at DESC);

-- Driver GPS locations
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m double precision,
  speed_kmh double precision,
  heading double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_recorded
  ON public.driver_locations(driver_id, recorded_at DESC);

-- Odometer logs
CREATE TABLE IF NOT EXISTS public.odometer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  odometer_value integer,
  photo_path text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_odometer_logs_driver_recorded
  ON public.odometer_logs(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_odometer_logs_vehicle_recorded
  ON public.odometer_logs(vehicle_id, recorded_at DESC);

-- Vehicle assignments
CREATE TABLE IF NOT EXISTS public.vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_driver
  ON public.vehicle_assignments(driver_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle
  ON public.vehicle_assignments(vehicle_id, assigned_at DESC);

-- Shifts table (if not present)
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled'))
);

-- Latest location view
CREATE OR REPLACE VIEW public.view_driver_latest_location AS
SELECT DISTINCT ON (driver_id)
  id,
  driver_id,
  shift_id,
  vehicle_id,
  lat,
  lng,
  accuracy_m,
  speed_kmh,
  heading,
  recorded_at
FROM public.driver_locations
ORDER BY driver_id, recorded_at DESC;

-- Current status view
CREATE OR REPLACE VIEW public.view_driver_current_status AS
SELECT
  d.id AS driver_id,
  p.last_seen_at,
  (p.last_seen_at > (now() - interval '60 seconds')) AS is_online,
  s.state AS status_state,
  (s.state = 'break') AS on_break,
  s.started_at AS status_started_at,
  l.recorded_at AS last_location_at,
  l.lat,
  l.lng,
  l.speed_kmh,
  l.heading,
  l.vehicle_id,
  l.shift_id
FROM public.drivers d
LEFT JOIN public.driver_presence p ON p.driver_id = d.id
LEFT JOIN LATERAL (
  SELECT state, started_at
  FROM public.driver_status_events
  WHERE driver_id = d.id
  ORDER BY started_at DESC
  LIMIT 1
) s ON true
LEFT JOIN public.view_driver_latest_location l ON l.driver_id = d.id;

-- Enable RLS
ALTER TABLE public.driver_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odometer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY IF NOT EXISTS driver_presence_admin_all ON public.driver_presence
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS driver_status_events_admin_all ON public.driver_status_events
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS driver_locations_admin_all ON public.driver_locations
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS odometer_logs_admin_all ON public.odometer_logs
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS vehicle_assignments_admin_all ON public.vehicle_assignments
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS shifts_admin_all ON public.shifts
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Driver app insert/update policies
CREATE POLICY IF NOT EXISTS driver_presence_self_upsert ON public.driver_presence
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS driver_presence_self_update ON public.driver_presence
  FOR UPDATE USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS driver_status_events_self_insert ON public.driver_status_events
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS driver_locations_self_insert ON public.driver_locations
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS odometer_logs_self_insert ON public.odometer_logs
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Allow drivers to view their own presence/status/location logs
CREATE POLICY IF NOT EXISTS driver_presence_self_select ON public.driver_presence
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS driver_status_events_self_select ON public.driver_status_events
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS driver_locations_self_select ON public.driver_locations
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY IF NOT EXISTS odometer_logs_self_select ON public.odometer_logs
  FOR SELECT USING (auth.uid() = driver_id);

-- Storage bucket for odometer photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('odometer_photos', 'odometer_photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS odometer_photos_admin_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'odometer_photos'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY IF NOT EXISTS odometer_photos_admin_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'odometer_photos'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY IF NOT EXISTS odometer_photos_driver_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'odometer_photos'
    AND auth.uid() IS NOT NULL
  );

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_status_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
