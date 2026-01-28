// Location logs data access layer (for live tracking)
import { supabase } from '../supabase';

export interface LocationLog {
  id: string;
  driver_id: string;
  shift_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  created_at: string;
}

export async function listLocationLogs(limit: number = 100): Promise<LocationLog[]> {
  const { data, error } = await supabase
    .from('location_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getLatestLocationByDriver(driverId: string): Promise<LocationLog | null> {
  const { data, error } = await supabase
    .from('location_logs')
    .select('*')
    .eq('driver_id', driverId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function listLatestLocationsByDrivers(driverIds?: string[]): Promise<LocationLog[]> {
  const ids = Array.isArray(driverIds) ? driverIds : [];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('location_logs')
    .select('*')
    .in('driver_id', ids)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('listLatestLocationsByDrivers error:', error);
    return [];
  }

  // Filter to get latest per driver
  const latestMap = new Map<string, LocationLog>();
  (data ?? []).forEach((log) => {
    if (!latestMap.has(log.driver_id)) {
      latestMap.set(log.driver_id, log);
    }
  });

  return Array.from(latestMap.values());
}

export async function createLocationLog(log: Omit<LocationLog, 'id' | 'created_at'>): Promise<LocationLog> {
  const { data, error } = await supabase
    .from('location_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToLocationUpdates(
  callback: (log: LocationLog) => void,
  onError?: (error: Error) => void
) {
  const subscription = supabase
    .channel('location_logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_logs' }, (payload) => {
      callback(payload.new as LocationLog);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to location updates');
      } else if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Failed to subscribe to location updates'));
      }
    });

  return subscription;
}
