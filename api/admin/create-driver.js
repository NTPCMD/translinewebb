import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' })
    }

    // Validate caller
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token)
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const requesterId = userData.user.id

    // Check admin role
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', requesterId)
        .single()

    if (profileError) {
      console.error('Admin profile lookup failed:', profileError.message)
      return res.status(500).json({ error: 'Failed to verify admin role' })
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Not admin' })
    }

    // Validate body
    const { email, password, name, phone } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name' })
    }

    // Check if auth user already exists — reuse if so
    let userId

    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Failed to list users:', listError.message)
      return res.status(500).json({ error: 'Failed to check existing users' })
    }

    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      console.log('Reusing existing auth user:', existingUser.id)
      userId = existingUser.id

      // Update password and phone in case they changed
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          ...(phone && { phone })
        })

      if (updateError) {
        console.error('Failed to update existing user:', updateError.message)
        return res.status(500).json({ error: 'Failed to update existing auth user', details: updateError.message })
      }

    } else {
      // Create new auth user
      const { data: newUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          ...(phone && { phone })
        })

      if (authError) {
        console.error('Auth user creation failed:', authError.message)
        return res.status(500).json({ error: 'Failed to create auth user', details: authError.message })
      }

      userId = newUser.user.id
    }

    // Upsert profile
    const { error: profileInsertError } =
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          full_name: name,
          role: 'driver',
          ...(phone && { phone })
        }, { onConflict: 'id' })

    if (profileInsertError) {
      console.error('Profile upsert failed:', profileInsertError.message)
      return res.status(500).json({ error: 'Failed to create driver profile', details: profileInsertError.message })
    }

    // Upsert driver row
    const { error: driverError } =
      await supabaseAdmin
        .from('drivers')
        .upsert({
          user_id: userId,
          status: 'active'
        }, { onConflict: 'user_id' })

    if (driverError) {
      console.error('Driver row upsert failed:', driverError.message)
      return res.status(500).json({ error: 'Failed to create driver record', details: driverError.message })
    }

    // Audit log (non-blocking)
    supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: requesterId,
        action: 'create_driver',
        target_user_id: userId,
        details: { email, name, ...(phone && { phone }) }
      })
      .then(({ error }) => {
        if (error) console.warn('Audit log failed (non-blocking):', error.message)
      })

    return res.status(200).json({ success: true, userId })

  } catch (err) {
    console.error('CREATE DRIVER CRASH:', err)
    return res.status(500).json({
      error: 'Unexpected server error',
      details: err.message
    })
  }
}
