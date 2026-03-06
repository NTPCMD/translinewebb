import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token)

  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid user' })
  }

  const requesterId = userData.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', requesterId)
    .single()

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Not admin' })
  }

  const { email, password, name } = req.body

  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

  if (createError) {
    return res.status(400).json(createError)
  }

  const newUserId = newUser.user.id

  const { error: driverError } = await supabase
    .from('drivers')
    .insert({
      user_id: newUserId,
      status: 'active'
    })

  if (driverError) {
    return res.status(400).json(driverError)
  }

  await supabase
    .from('profiles')
    .insert({
      id: newUserId,
      full_name: name,
      role: 'driver'
    })

  return res.status(200).json({ success: true })
}
