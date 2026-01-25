// Maintenance data access layer
import { supabase } from '../supabase';

export interface MaintenanceItem {
  id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  odometer?: number;
  cost?: number;
  provider?: string;
  invoice_url?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export async function listMaintenanceItems(): Promise<MaintenanceItem[]> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .select('*')
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listPendingMaintenanceItems(): Promise<MaintenanceItem[]> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .select('*')
    .eq('status', 'pending')
    .order('service_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMaintenanceItem(id: string): Promise<MaintenanceItem | null> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createMaintenanceItem(item: Omit<MaintenanceItem, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceItem> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMaintenanceItem(id: string, updates: Partial<MaintenanceItem>): Promise<MaintenanceItem> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMaintenanceItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function countPendingMaintenance(): Promise<number> {
  const { count, error } = await supabase
    .from('maintenance_items')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

export async function listByVehicleId(vehicleId: string): Promise<MaintenanceItem[]> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
}
