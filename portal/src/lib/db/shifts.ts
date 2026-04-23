// Shifts data access layer
import { supabase } from '../supabase';

export type ShiftChecklistValue = 'pass' | 'fail' | null;

export interface Shift {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'ended' | 'cancelled';
  checklist?: Record<string, ShiftChecklistValue> | null;
  driver_name?: string | null;
  vehicle_rego?: string | null;
}

type ShiftRow = {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'ended' | 'cancelled';
  checklist?: Record<string, ShiftChecklistValue> | null;
};

async function enrichShiftRows(rows: ShiftRow[]): Promise<Shift[]> {
  const driverIds = Array.from(new Set(rows.map((row) => row.driver_id).filter(Boolean)));
  const vehicleIds = Array.from(new Set(rows.map((row) => row.vehicle_id).filter(Boolean))) as string[];

  const [driversResponse, vehiclesResponse] = await Promise.all([
    driverIds.length > 0
      ? supabase
          .from('drivers_with_current_vehicle')
          .select('driver_id, full_name')
          .in('driver_id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleIds.length > 0
      ? supabase.from('vehicles').select('id, rego').in('id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (driversResponse.error) throw driversResponse.error;
  if (vehiclesResponse.error) throw vehiclesResponse.error;

  const driverNameById = new Map((driversResponse.data ?? []).map((row) => [row.driver_id, row.full_name]));
  const vehicleRegoById = new Map((vehiclesResponse.data ?? []).map((row) => [row.id, row.rego]));

  return rows.map((row) => ({
    ...row,
    driver_name: row.driver_id ? driverNameById.get(row.driver_id) ?? null : null,
    vehicle_rego: row.vehicle_id ? vehicleRegoById.get(row.vehicle_id) ?? null : null,
  }));
}

async function fetchShifts(options?: { onlyActive?: boolean }): Promise<Shift[]> {
  let query = supabase
    .from('shifts')
    .select('id, driver_id, vehicle_id, started_at, ended_at, status, checklist')
    .order('started_at', { ascending: false });

  if (options?.onlyActive) {
    query = query.or('status.eq.active,ended_at.is.null');
  }

  const { data, error } = await query;

  if (error) throw error;
  return enrichShiftRows((data as ShiftRow[]) ?? []);
}

export async function listShifts(): Promise<Shift[]> {
  return fetchShifts();
}

export async function listActiveShifts(): Promise<Shift[]> {
  return fetchShifts({ onlyActive: true });
}

export async function getShift(id: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('id, driver_id, vehicle_id, started_at, ended_at, status, checklist')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [enriched] = await enrichShiftRows([data as ShiftRow]);
  return enriched ?? null;
}

export async function createShift(shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .insert([shift])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateShift(id: string, updates: Partial<Shift>): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function endShift(id: string): Promise<Shift> {
  return updateShift(id, { ended_at: new Date().toISOString(), status: 'ended' });
}

export async function countActiveShifts(): Promise<number> {
  const { count, error } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .or('status.eq.active,ended_at.is.null');

  if (error) throw error;
  return count || 0;
}

export async function countDistinctDriversOnActiveShifts(): Promise<number> {
  const { data, error } = await supabase
    .from('shifts')
    .select('driver_id')
    .or('status.eq.active,ended_at.is.null')
    .not('driver_id', 'is', null);

  if (error) throw error;

  const uniqueDriverIds = new Set((data ?? []).map((row) => row.driver_id as string));
  return uniqueDriverIds.size;
}

export async function countDistinctVehiclesOnActiveShifts(): Promise<number> {
  const { data, error } = await supabase
    .from('shifts')
    .select('vehicle_id')
    .or('status.eq.active,ended_at.is.null')
    .not('vehicle_id', 'is', null);

  if (error) throw error;

  const uniqueVehicleIds = new Set((data ?? []).map((row) => row.vehicle_id as string));
  return uniqueVehicleIds.size;
}

export async function countTodayShifts(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count, error } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', today.toISOString())
    .lt('started_at', tomorrow.toISOString());

  if (error) throw error;
  return count || 0;
}
