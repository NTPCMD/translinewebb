// Environment validation helper
export function validateEnv(): void {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar as keyof ImportMeta['env']]
  );

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}. 
    Please set these in your .env.local file.`;
    console.error(message);
    throw new Error(message);
  }
}

export function getEnv(key: keyof ImportMeta['env']): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${String(key)} is not set`);
  }
  return value;
}
