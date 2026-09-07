import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getPublicEnvIssues } from '../../config/publicEnv';
import { PortalStartup, StartupNotice } from './PortalStartup';

const anonKey = 'header.' + btoa(JSON.stringify({ role: 'anon' })) + '.signature';
const valid = { VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_ANON_KEY: anonKey };

describe('portal configuration and startup', () => {
  it('accepts public anon and publishable configuration', () => {
    expect(getPublicEnvIssues(valid)).toEqual([]);
    expect(getPublicEnvIssues({ ...valid, VITE_SUPABASE_ANON_KEY: 'sb_publishable_example' })).toEqual([]);
  });
  it('reports both missing names without throwing', () => {
    expect(getPublicEnvIssues({})).toEqual(['VITE_SUPABASE_URL is missing.', 'VITE_SUPABASE_ANON_KEY is missing.']);
    expect(getPublicEnvIssues({ VITE_SUPABASE_URL: ' ', VITE_SUPABASE_ANON_KEY: '' })).toHaveLength(2);
  });
  it('rejects malformed or unsafe URLs', () => {
    for (const url of ['not-a-url', 'javascript:alert(1)', 'https://<your-project>.supabase.co', 'https://admin:password@project.supabase.co']) {
      expect(getPublicEnvIssues({ ...valid, VITE_SUPABASE_URL: url })).toHaveLength(1);
    }
  });
  it('rejects secret keys without echoing their values', () => {
    for (const key of ['sb_secret_private', 'header.' + btoa(JSON.stringify({ role: 'service_role' })) + '.signature', 'invalid-key']) {
      const issues = getPublicEnvIssues({ ...valid, VITE_SUPABASE_ANON_KEY: key });
      expect(issues).toHaveLength(1);
      expect(issues.join(' ')).not.toContain(key);
    }
  });
  it('renders setup help without loading the app or its Supabase imports', () => {
    const loadApp = vi.fn(async () => ({ default: () => React.createElement('div', null, 'App') }));
    const App = React.lazy(loadApp);
    const html = renderToStaticMarkup(React.createElement(PortalStartup, { env: {}, children: React.createElement(App) }));
    expect(html).toContain('Portal setup required.');
    expect(html).toContain('VITE_SUPABASE_URL is missing.');
    expect(loadApp).not.toHaveBeenCalled();
  });
  it('renders children only with valid public configuration', () => {
    const html = renderToStaticMarkup(React.createElement(PortalStartup, { env: valid, children: React.createElement('div', null, 'Ready to sign in') }));
    expect(html).toContain('Ready to sign in');
    expect(html).not.toContain('Portal setup required.');
  });
  it('provides a recoverable load-error state', () => {
    const html = renderToStaticMarkup(React.createElement(StartupNotice, { setup: false }));
    expect(html).toContain('The portal could not open.');
    expect(html).toContain('Refresh portal');
    expect(html).toContain('Back to website');
  });
});
