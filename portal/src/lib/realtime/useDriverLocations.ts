import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DriverLocation } from '@/lib/db/locations';

export function useDriverLocations(
  onLocationInsert: (row: DriverLocation) => void
) {
  useEffect(() => {
    const locationChannel = supabase
      .channel('driver_locations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_locations' },
        (payload) => {
          onLocationInsert(payload.new as DriverLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
    };
  }, [onLocationInsert]);
}
