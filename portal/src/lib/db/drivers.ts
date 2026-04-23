// Drivers data access layer
import { supabase } from '../supabase';

export interface Driver {
  driver_id: string;
  full_name?: string | null;
  profile_email?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: 'active' | 'inactive' | string | null;
  auth_user_id?: string | null;
  current_vehicle_id?: string | null;
  current_vehicle_rego?: string | null;
}

export async function listDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers_with_current_vehicle')
    .select('driver_id, full_name, profile_email, email, phone, status, auth_user_id, current_vehicle_id, current_vehicle_rego')
    .order('full_name');

  if (error) throw error;
  return (data as Driver[]) || [];
}

export async function getDriver(id: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from('drivers_with_current_vehicle')
    .select('driver_id, full_name, profile_email, email, phone, status, auth_user_id, current_vehicle_id, current_vehicle_rego')
    .eq('driver_id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Driver | null) ?? null;
}

export async function createDriver(driver: Record<string, unknown>): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .insert([driver])
    .select('*')
    .single();

  if (error) throw error;
  return data as Driver;
}

export async function updateDriver(id: string, updates: Record<string, unknown>): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Driver;
}

export async function deleteDriver(id: string): Promise<void> {
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function countActiveDrivers(): Promise<number> {
  const { count, error } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) throw error;
  return count || 0;
}

export async function countTotalDrivers(): Promise<number> {
  const { count, error } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}
