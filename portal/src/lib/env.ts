// Explicit references let Vite include only the public configuration required
// by this client. The bootstrap validates it before importing the application.
const publicEnv = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export function getEnv(key: keyof typeof publicEnv): string {
  const value = publicEnv[key]?.trim();
  if (!value) {
    throw new Error(`Environment variable ${String(key)} is not set`);
  }
  return value;
}
