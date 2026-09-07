export type PublicPortalEnv = Record<string, unknown>;

// Shared by the build and the browser bootstrap. Never include supplied values
// in diagnostics: only the public variable names may be reported.
export function getPublicEnvIssues(env: PublicPortalEnv): string[] {
  const issues: string[] = [];
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const key = typeof env.VITE_SUPABASE_ANON_KEY === 'string' ? env.VITE_SUPABASE_ANON_KEY.trim() : '';
  if (!url) issues.push('VITE_SUPABASE_URL is missing.');
  else {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || /[<>]/.test(url)) throw new Error();
    } catch { issues.push('VITE_SUPABASE_URL must be a valid HTTP(S) project URL.'); }
  }
  if (!key) issues.push('VITE_SUPABASE_ANON_KEY is missing.');
  else if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = key.split('.')[1];
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.role !== 'anon') throw new Error();
    } catch {
      issues.push('VITE_SUPABASE_ANON_KEY must be a public anon or publishable key, never a secret or service-role key.');
    }
  }
  return issues;
}
