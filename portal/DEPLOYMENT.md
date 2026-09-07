# Admin portal deployment

The public website and admin portal are built together from the repository root.
The portal is served at /portal/. Use the existing root build command in Vercel.

## Required public settings

In the Vercel **translinewebb** project, open **Settings → Environment Variables**.
Set both variables for **Production** and for any **Preview** deployment that
needs a working admin portal:

- VITE_SUPABASE_URL: the Supabase project URL.
- VITE_SUPABASE_ANON_KEY: the public anon key or publishable key from the same
  Supabase project.

Do not put a service-role key, secret key, database password or email API key in
any VITE_ variable. These values are included in browser bundles. Database access
must continue to be controlled by authentication and Supabase Row Level Security.

For local development only, use portal/.env.local; it is intentionally ignored
by Git. Its existence does not configure Vercel. Never commit that file.

After saving the Vercel variables, **redeploy**. Vite substitutes these settings
at build time; an existing deployment cannot pick up newly saved values.
The portal build now stops with a named configuration error if either variable
is missing or the client key is unsuitable, instead of deploying a broken login.

## If an older portal is cached

Save any open work. Close all tabs/windows of the portal (including its installed
app), then reopen /portal/login. Once the updated portal has loaded, its update
notice offers **Refresh portal** or **Later**. It does not automatically reload
unfinished forms when another tab accepts an update.

The bootstrap also displays readable setup or loading-error help if app startup
fails. This screen does not bypass authentication or substitute a demo database.

## Verification

- npm --prefix portal test
- node scripts/verify-portal-theme.mjs
- npm run build
- npm run verify:site

After deployment, open /portal/login in a fresh tab and confirm the new red/cream
login loads without configuration errors. Sign in with an approved admin account
to verify private data and driver tracking. Do not use a driver account to test
admin access or disable the admin guard.
