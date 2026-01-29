import { supabase } from '@/lib/supabase';

// Helper to determine if a row from drivers_full represents a real driver
export function isDriverRow(row: any): boolean {
  if (!row) return false;
  if ('role' in row) return row.role === 'driver';
  // Fallback: if the row has a driver_id or auth_user_id it's probably a driver
  return Boolean(row.driver_id || row.auth_user_id);
}

export async function fetchDriversFull() {
  try {
    const { data, error } = await supabase
      .from('drivers_full')
      .select('*');
    if (error) {
      console.warn('fetchDriversFull: failed to fetch drivers_full', error.message);
      return [];
    }
    return data ?? [];
  } catch (err: any) {
    console.error('fetchDriversFull: unexpected error', err?.message ?? err);
    return [];
  }
}

export async function fetchDriverOptions() {
  try {
    // Request commonly available columns, omit `role` since some deployments lack it
    const { data, error } = await supabase
      .from('drivers_full')
      .select('driver_id, full_name, profile_email, email, auth_user_id');
    if (error) {
      console.warn('fetchDriverOptions: failed to select columns, retrying with *', error.message);
      const { data: fallbackData, error: fallbackError } = await supabase.from('drivers_full').select('*');
      if (fallbackError) {
        console.error('fetchDriverOptions: failed to fetch drivers_full', fallbackError.message);
        return [];
      }
      return fallbackData ?? [];
    }
    return data ?? [];
  } catch (err: any) {
    console.error('fetchDriverOptions: unexpected error', err?.message ?? err);
    return [];
  }
}
