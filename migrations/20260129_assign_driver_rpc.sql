-- Migration: Add RPC to atomically assign a driver to a vehicle

-- This function unassigns any currently active vehicle for the driver and assigns the driver to the requested vehicle in a single transaction.
CREATE OR REPLACE FUNCTION public.assign_driver_to_vehicle(p_driver uuid, p_vehicle uuid)
RETURNS public.vehicles AS $$
DECLARE
  updated public.vehicles%ROWTYPE;
  has_is_active boolean := false;
  has_active boolean := false;
  uses_profiles_fk boolean := false;
  assigned_uuid uuid := NULL;
BEGIN
  -- If no driver provided, just unassign the target vehicle
  IF p_driver IS NULL THEN
    UPDATE public.vehicles
      SET assigned_driver_id = NULL, assigned_at = NULL
      WHERE id = p_vehicle
      RETURNING * INTO updated;
    RETURN updated;
  END IF;

  -- Detect which active flag column exists on the vehicles table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'is_active'
  ) INTO has_is_active;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'active'
  ) INTO has_active;

  -- Detect if assigned_driver_id references profiles table (profiles.id)
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage ccu
    JOIN information_schema.key_column_usage kcu ON ccu.constraint_name = kcu.constraint_name AND ccu.constraint_schema = kcu.constraint_schema
    WHERE kcu.table_schema = 'public' AND kcu.table_name = 'vehicles' AND kcu.column_name = 'assigned_driver_id'
      AND ccu.table_schema = 'public' AND ccu.table_name = 'profiles'
  ) INTO uses_profiles_fk;

  -- Determine which UUID to use for assigned_driver_id based on FK expectation
  IF uses_profiles_fk THEN
    -- If caller passed a profiles.id directly, use it; otherwise map drivers.id -> drivers.auth_user_id
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_driver) THEN
      assigned_uuid := p_driver;
    ELSE
      SELECT auth_user_id INTO assigned_uuid FROM drivers WHERE id = p_driver;
      IF assigned_uuid IS NULL THEN
        RAISE EXCEPTION 'Driver mapping failed: provided id % is not a profiles.id and no drivers.auth_user_id found', p_driver;
      END IF;
    END IF;
  ELSE
    -- Vehicles.assigned_driver_id expects drivers.id (or no FK to profiles). Use provided driver id directly.
    assigned_uuid := p_driver;
  END IF;

  -- Unassign any currently active vehicle for the driver using whichever active column exists
  IF has_is_active THEN
    UPDATE public.vehicles
      SET assigned_driver_id = NULL, assigned_at = NULL
      WHERE assigned_driver_id = assigned_uuid AND is_active = true;
  ELSIF has_active THEN
    UPDATE public.vehicles
      SET assigned_driver_id = NULL, assigned_at = NULL
      WHERE assigned_driver_id = assigned_uuid AND active = true;
  ELSE
    -- If neither column exists, fall back to best-effort unassign
    UPDATE public.vehicles
      SET assigned_driver_id = NULL, assigned_at = NULL
      WHERE assigned_driver_id = assigned_uuid;
  END IF;

  -- Assign the requested vehicle to the driver (using the resolved UUID)
  UPDATE public.vehicles
    SET assigned_driver_id = assigned_uuid, assigned_at = now()
    WHERE id = p_vehicle
    RETURNING * INTO updated;

  RETURN updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;