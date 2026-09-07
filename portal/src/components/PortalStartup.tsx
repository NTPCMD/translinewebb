import React, { Suspense } from 'react';
import { getPublicEnvIssues, type PublicPortalEnv } from '../../config/publicEnv';
import logo from '@/assets/transline-logo-lockup.png';

export function StartupNotice({ setup, issues = [] }: { setup: boolean; issues?: string[] }) {
  return (
    <main className="portalStartup">
      <a href="/" className="portalStartupBrand"><img src={logo} alt="Transline Logistics" /></a>
      <div>
        <p className="portalEyebrow">Admin portal</p>
        <h1>{setup ? 'Portal setup required.' : 'The portal could not open.'}</h1>
        <p>{setup
          ? 'The website is available, but this admin deployment is missing its database connection settings. Your administrator needs to update the deployment configuration.'
          : 'A required part of the portal could not load. Check your connection and refresh to try again.'}</p>
        {setup && <details><summary>Deployment details</summary><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul><p>Add the public Supabase URL and client key in Vercel’s project environment variables, then redeploy. Never use a service-role key in the browser.</p></details>}
        <div className="portalStartupActions"><button onClick={() => window.location.reload()}>Refresh portal</button><a href="/">Back to website</a></div>
      </div>
    </main>
  );
}

export class PortalErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error('Portal failed to start.', error); }
  render() { return this.state.failed ? <StartupNotice setup={false} /> : this.props.children; }
}

export function PortalStartup({ env, children }: { env: PublicPortalEnv; children: React.ReactNode }) {
  const issues = getPublicEnvIssues(env);
  if (issues.length) return <StartupNotice setup issues={issues} />;
  return (
    <PortalErrorBoundary>
      <Suspense fallback={<div className="portalStartupLoading" role="status"><span />Opening your admin workspace…</div>}>
        {children}
      </Suspense>
    </PortalErrorBoundary>
  );
}
