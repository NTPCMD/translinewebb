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

    // validate user
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token)

    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid user' })
    }

    const requesterId = userData.user.id

    // check admin role
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', requesterId)
        .single()

    if (profileError) {
      console.error(profileError)
      return res.status(500).json(profileError)
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Not admin' })
    }

    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    // create auth user
    const { data: newUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

    if (authError) {
      console.error(authError)
      return res.status(500).json(authError)
    }

    const userId = newUser.user.id

    // create profile
    const { error: profileInsertError } =
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          full_name: name,
          role: 'driver'
        })

    if (profileInsertError) {
      console.error(profileInsertError)
      return res.status(500).json(profileInsertError)
    }

    // create driver
    const { error: driverError } =
      await supabaseAdmin
        .from('drivers')
        .insert({
          user_id: userId,
          status: 'active'
        })

    if (driverError) {
      console.error(driverError)
      return res.status(500).json(driverError)
    }

    return res.status(200).json({ success: true })

  } catch (err) {

    console.error('CREATE DRIVER CRASH', err)

    return res.status(500).json({
      error: 'Server crash',
      details: err.message
    })

  }

}
