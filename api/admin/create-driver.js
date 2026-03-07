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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  // verify user
  const { data: userData, error: userError } =
    await supabaseClient.auth.getUser(token)

  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid user' })
  }

  const requesterId = userData.user.id

  // check admin role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', requesterId)
    .single()

  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Not admin' })
  }

  const { email, password, name } = req.body

  // create auth user
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

  if (createError) {
    return res.status(400).json(createError)
  }

  const newUserId = newUser.user.id

  // create driver profile
  await supabaseAdmin.from('profiles').insert({
    id: newUserId,
    full_name: name,
    role: 'driver'
  })

  // create driver row
  await supabaseAdmin.from('drivers').insert({
    user_id: newUserId,
    status: 'active'
  })

  return res.status(200).json({ success: true })
}
