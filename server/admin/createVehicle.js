import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createVehicle(req, res) {
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('createVehicle: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Create a Supabase client with the service role key to verify the requester's JWT and perform admin operations
  const serviceRoleClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify token and get user
  const { data: userData, error: userError } = await serviceRoleClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const requesterId = userData.user.id;

  // Check that the requester has admin role in the profiles table
  const { data: profile, error: profileError } = await serviceRoleClient
    .from('profiles')
    .select('role')
    .eq('id', requesterId)
    .single();
  if (profileError || !profile) {
    return res.status(403).json({ error: 'Requester profile not found' });
  }
  if (profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin role required' });
  }

  // Validate request body
  const { name, plate_number } = req.body || {};
  if (!name || !plate_number) {
    return res.status(400).json({ error: 'name and plate_number are required' });
  }

  // Insert the vehicle record
  const { data: vehicle, error: insertError } = await serviceRoleClient
    .from('vehicles')
    .insert({ name, plate_number })
    .select()
    .single();
  if (insertError) {
    console.error('createVehicle: vehicles insert error=', insertError);
    return res.status(400).json({ error: insertError.message || 'Failed to create vehicle' });
  }

  // Log the admin action in the audit log (best-effort, non-blocking)
  serviceRoleClient.from('admin_audit_logs').insert({
    admin_id: requesterId,
    action: 'create_vehicle',
    target_type: 'vehicle',
    target_id: vehicle.id,
    metadata: {
      name,
      plate_number,
    },
  }).then(({ error: auditError }) => {
    if (auditError) console.warn('createVehicle: audit log insert failed=', auditError);
  });

  return res.status(201).json({ vehicle });
}
