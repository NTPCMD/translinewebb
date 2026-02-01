import { supabase } from '@/lib/supabase';

const DRIVERS_FULL_FILTER = 'role.eq.driver,driver_id.not.is.null,auth_user_id.not.is.null';

type DriversFullFilters = {
  status?: string;
  company_id?: string;
  restaurant_id?: string;
  org_id?: string;
  owner_user_id?: string;
  active?: boolean;
  deleted_at?: string | null;
};

const applyDriversFullFilters = (query: any, filters?: DriversFullFilters) => {
  if (!filters) return query;
  let next = query;
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      next = next.is(key, null);
      return;
    }
    next = next.eq(key, value);
  });
  return next;
};

// Helper to determine if a row from drivers_full represents a real driver
export function isDriverRow(row: any): boolean {
  if (!row) return false;
  if ('role' in row) return row.role === 'driver';
  // Fallback: if the row has a driver_id or auth_user_id it's probably a driver
  return Boolean(row.driver_id || row.auth_user_id);
}

export async function fetchDriversFull(filters?: DriversFullFilters) {
  try {
    console.info('fetchDriversFull: query=drivers_full filters=', filters ?? {}, 'orFilter=', DRIVERS_FULL_FILTER);
    const { data, error } = await applyDriversFullFilters(
      supabase.from('drivers_full').select('*').or(DRIVERS_FULL_FILTER),
      filters
    );
    if (error) {
      console.warn('fetchDriversFull: failed to fetch drivers_full', error);
      return [];
    }
    console.info('fetchDriversFull: result length=', data?.length ?? 0);
    return data ?? [];
  } catch (err: any) {
    console.error('fetchDriversFull: unexpected error', err?.message ?? err);
    return [];
  }
}

export async function fetchDriversFullCount(filters?: DriversFullFilters) {
  try {
    console.info('fetchDriversFullCount: query=drivers_full filters=', filters ?? {}, 'orFilter=', DRIVERS_FULL_FILTER);
    const { count, error } = await applyDriversFullFilters(
      supabase.from('drivers_full').select('*', { count: 'exact', head: true }).or(DRIVERS_FULL_FILTER),
      filters
    );
    if (error) {
      console.warn('fetchDriversFullCount: failed to count drivers_full', error);
      return 0;
    }
    console.info('fetchDriversFullCount: count=', count ?? 0);
    return count ?? 0;
  } catch (err: any) {
    console.error('fetchDriversFullCount: unexpected error', err?.message ?? err);
    return 0;
  }
}

export async function fetchDriverOptions(filters?: DriversFullFilters) {
  try {
    console.info('fetchDriverOptions: query=drivers_full filters=', filters ?? {}, 'orFilter=', DRIVERS_FULL_FILTER);
    // Request commonly available columns, omit `role` since some deployments lack it
    const { data, error } = await applyDriversFullFilters(
      supabase
        .from('drivers_full')
        .select('driver_id, full_name, profile_email, email, auth_user_id')
        .or(DRIVERS_FULL_FILTER),
      filters
    );
    if (error) {
      console.warn('fetchDriverOptions: failed to select columns, retrying with *', error.message);
      const { data: fallbackData, error: fallbackError } = await applyDriversFullFilters(
        supabase.from('drivers_full').select('*').or(DRIVERS_FULL_FILTER),
        filters
      );
      if (fallbackError) {
        console.error('fetchDriverOptions: failed to fetch drivers_full', fallbackError);
        return [];
      }
      console.info('fetchDriverOptions: fallback result length=', fallbackData?.length ?? 0);
      return fallbackData ?? [];
    }
    console.info('fetchDriverOptions: result length=', data?.length ?? 0);
    return data ?? [];
  } catch (err: any) {
    console.error('fetchDriverOptions: unexpected error', err?.message ?? err);
    return [];
  }
}
