import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DriverPresenceRow {
  driver_id: string;
  last_seen_at: string;
  updated_at: string;
}

export interface DriverStatusEventRow {
  id: string;
  driver_id: string;
  shift_id?: string | null;
  state: 'online' | 'offline' | 'break' | 'driving' | 'idle';
  started_at: string;
  ended_at?: string | null;
  meta?: Record<string, unknown>;
}

export function useDriverPresence(
  onPresenceUpdate: (row: DriverPresenceRow) => void,
  onStatusUpdate?: (row: DriverStatusEventRow) => void
) {
  useEffect(() => {
    const presenceChannel = supabase
      .channel('driver_presence')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_presence' },
        (payload) => {
          onPresenceUpdate(payload.new as DriverPresenceRow);
        }
      )
      .subscribe();

    const statusChannel = supabase
      .channel('driver_status_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_status_events' },
        (payload) => {
          if (onStatusUpdate) {
            onStatusUpdate(payload.new as DriverStatusEventRow);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [onPresenceUpdate, onStatusUpdate]);
}
