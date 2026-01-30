// Driver location data access layer (for live tracking)
import { supabase } from '../supabase';

export interface DriverLocation {
  id: string;
  driver_id: string;
  shift_id?: string | null;
  vehicle_id?: string | null;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
  speed_kmh?: number | null;
  heading?: number | null;
  recorded_at: string;
}

export async function listLatestLocationsByDrivers(driverIds?: string[]): Promise<DriverLocation[]> {
  const ids = Array.isArray(driverIds) ? driverIds : [];
  let query = supabase.from('view_driver_latest_location').select('*');
  if (ids.length > 0) {
    query = query.in('driver_id', ids);
  }

  const { data, error } = await query;
  if (error) {
    console.error('listLatestLocationsByDrivers error:', error);
    return [];
  }

  return (data as DriverLocation[]) || [];
}

export async function createLocationLog(
  log: Omit<DriverLocation, 'id' | 'recorded_at'>
): Promise<DriverLocation> {
  const { data, error } = await supabase
    .from('driver_locations')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data as DriverLocation;
}

export function subscribeToLocationUpdates(
  callback: (log: DriverLocation) => void,
  onError?: (error: Error) => void
) {
  const subscription = supabase
    .channel('driver_locations')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_locations' }, (payload) => {
      callback(payload.new as DriverLocation);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to driver location updates');
      } else if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Failed to subscribe to driver location updates'));
      }
    });

  return subscription;
}
