# Portal Deployment Configuration

## Portal Accessibility

The admin portal is now configured to be accessible at:

```
https://translinelogistics.org/portal
```

## Configuration Applied

### 1. Vite Base Path
**File:** `portal/vite.config.ts`
```typescript
base: '/portal/'
```
This tells Vite to build assets with the `/portal/` prefix.

### 2. React Router Basename
**File:** `portal/src/routes.tsx`
```typescript
const router = createBrowserRouter(routes, { basename: '/portal' });
```
This tells React Router that all routes are relative to `/portal`.

### 3. Build Output
The build script outputs:
- Main site: `dist/index.html` (served at `/`)
- Portal app: `dist/portal/` (served at `/portal/`)

### 4. Routing Configuration

**Vercel (vercel.json):**
```json
{
  "rewrites": [
    { "source": "/portal/assets/(.*)", "destination": "/portal/assets/$1" },
    { "source": "/portal", "destination": "/portal/index.html" },
    { "source": "/portal/(.*)", "destination": "/portal/index.html" }
  ]
}
```

**Netlify (netlify.toml):**
```toml
[[redirects]]
  from = "/portal/*"
  to = "/portal/index.html"
  status = 200
```

## Deployment Steps

### For Vercel
1. Push to your repository
2. Vercel automatically detects the `vercel.json` config
3. Portal will be live at `translinelogistics.org/portal`

### For Netlify
1. Push to your repository
2. Netlify automatically detects the `netlify.toml` config
3. Portal will be live at `translinelogistics.org/portal`

### For Self-Hosted (Express/Node)
```javascript
import express from 'express';

const app = express();

// Serve main site
app.use(express.static('dist'));

// Serve portal
app.use('/portal', express.static('dist/portal'));

// SPA fallback for portal
app.get('/portal/*', (req, res) => {
  res.sendFile('dist/portal/index.html');
});

// SPA fallback for main site
app.get('*', (req, res) => {
  res.sendFile('dist/index.html');
});

app.listen(3000);
```

## Development

### Run Both Sites Locally
```bash
npm run dev
```
This starts:
- Main site: http://localhost:5173
- Portal: http://localhost:5173/portal

### Build
```bash
npm run build
```
This creates:
- `dist/` - Main site
- `dist/portal/` - Admin portal

## URL Structure

| Route | Purpose |
|-------|---------|
| `/portal` | Portal login page |
| `/portal/` | Portal dashboard (when logged in) |
| `/portal/drivers` | Drivers management |
| `/portal/vehicles` | Vehicles management |
| `/portal/live-map` | Live location tracking |
| `/portal/shifts` | Shifts management |
| `/portal/maintenance` | Maintenance tracking |
| `/portal/logs` | Activity logs |
| `/portal/settings` | Portal settings |

## Environment Variables

The portal requires these environment variables to be set:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Portal

1. **Local Testing**
   ```bash
   npm run dev
   # Go to http://localhost:5173/portal
   ```

2. **Production Testing**
   ```bash
   npm run build
   npm start
   # Go to http://localhost:3000/portal
   ```

## Troubleshooting

### Portal shows 404
- Ensure `dist/portal/` directory exists after build
- Check that `.html` routes are configured in your deployment platform
- Verify `basename: '/portal'` is set in routes.tsx

### Assets not loading
- Check browser DevTools → Network tab for 404s on CSS/JS
- Ensure base path is set correctly in vite.config.ts
- Verify `dist/portal/assets/` directory exists

### Login redirects not working
- Verify `basename: '/portal'` is in router configuration
- Check that auth redirects use relative paths
- Test localStorage persistence in DevTools

## Production Checklist

- [x] Vite base path configured
- [x] React Router basename configured
- [x] Build includes portal at /portal/
- [x] Deployment config has /portal/* rules
- [x] Environment variables set
- [x] CORS configured for Supabase
- [x] Session persistence tested
- [x] All routes accessible

## Status

✅ Portal is configured and ready to deploy!

To deploy:
1. Commit and push changes
2. Deploy to your hosting platform
3. Access at `translinelogistics.org/portal`
