import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createDriver(req, res) {
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('createDriver: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
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
  const { email, password, name, phone } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  // Create the new user in Supabase Auth using service role
  const { data: newUser, error: createError } = await serviceRoleClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name, phone: phone || '', status: 'active' },
    email_confirm: true,
  });
  if (createError || !newUser?.user) {
    console.error('createDriver: auth.admin.createUser error=', createError);
    return res.status(400).json({ error: createError?.message || 'Failed to create auth user' });
  }
  const newUserId = newUser.user.id;

  // Insert a corresponding record in the drivers table linked by user_id
  const { data: driverRecord, error: insertError } = await serviceRoleClient
    .from('drivers')
    .insert([
      {
        user_id: newUserId,
        name,
        email,
        phone: phone || '',
        status: 'active',
      },
    ])
    .select()
    .single();
  if (insertError) {
    console.error('createDriver: drivers insert error=', insertError);
    // Attempt to clean up the created auth user to avoid orphaned accounts
    await serviceRoleClient.auth.admin.deleteUser(newUserId);
    return res.status(500).json({ error: insertError.message || 'Failed to insert driver record' });
  }

  return res.status(201).json({ driver: driverRecord });
}
