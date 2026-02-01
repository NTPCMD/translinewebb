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
  console.info('listDrivers: query=drivers filters={}');
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('listDrivers: error=', error);
    throw error;
  }
  console.info('listDrivers: result length=', data?.length ?? 0);
  return data || [];
}

export async function getDriver(id: string): Promise<Driver | null> {
  console.info('getDriver: query=drivers filters=', { id });
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('getDriver: error=', error);
    throw error;
  }
  console.info('getDriver: found=', Boolean(data));
  return data || null;
}

export async function createDriver(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<Driver> {
  console.info('createDriver: insert=drivers payload=', driver);
  const { data, error } = await supabase
    .from('drivers')
    .insert([driver])
    .select()
    .single();

  if (error) {
    console.warn('createDriver: error=', error);
    throw error;
  }
  console.info('createDriver: inserted id=', data?.id);
  return data;
}

export async function updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
  console.info('updateDriver: query=drivers filters=', { id }, 'updates=', updates);
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.warn('updateDriver: error=', error);
    throw error;
  }
  console.info('updateDriver: updated id=', data?.id);
  return data;
}

export async function deleteDriver(id: string): Promise<void> {
  console.info('deleteDriver: query=drivers filters=', { id });
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);

  if (error) {
    console.warn('deleteDriver: error=', error);
    throw error;
  }
}

export async function countActiveDrivers(): Promise<number> {
  console.info('countActiveDrivers: query=drivers filters=', { status: 'active' });
  const { count, error } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) {
    console.warn('countActiveDrivers: error=', error);
    throw error;
  }
  console.info('countActiveDrivers: count=', count ?? 0);
  return count || 0;
}

export async function countTotalDrivers(): Promise<number> {
  console.info('countTotalDrivers: query=drivers filters={}');
  const { count, error } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.warn('countTotalDrivers: error=', error);
    throw error;
  }
  console.info('countTotalDrivers: count=', count ?? 0);
  return count || 0;
}
