import React from 'react'
import ReactDOM from 'react-dom/client'
import { PortalStartup } from '@/components/PortalStartup'
import { PortalUpdateNotice } from '@/components/PortalUpdateNotice'
import '@/styles/index.css'

// App imports the Supabase client. Defer that import until public configuration
// has been validated so a missing setting cannot crash before React mounts.
const App = React.lazy(() => import('@/app/App'))

if (import.meta.env.PROD) {
  const manifestHref = `${import.meta.env.BASE_URL}manifest.json`;
  const existingManifestLink = document.querySelector('link[rel="manifest"]');

  if (!existingManifestLink) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestHref;
    document.head.appendChild(manifestLink);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PortalStartup env={{
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    }}>
      <App />
    </PortalStartup>
    <PortalUpdateNotice />
  </React.StrictMode>,
)
