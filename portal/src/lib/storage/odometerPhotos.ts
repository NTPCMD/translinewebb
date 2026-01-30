import { supabase } from '@/lib/supabase';

const BUCKET = 'odometer_photos';

export async function getOdometerPhotoUrl(path: string, expiresInSeconds: number = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error('Failed to create signed URL', error);
    return null;
  }
  return data?.signedUrl ?? null;
}
