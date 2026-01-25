// Drivers data access layer
import { supabase } from '../supabase';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export async function listDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDriver(id: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createDriver(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .insert([driver])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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
