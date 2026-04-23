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

export async function listShifts(): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listActiveShifts(): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .or('status.eq.active,ended_at.is.null')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getShift(id: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
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
