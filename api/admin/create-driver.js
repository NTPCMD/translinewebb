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
      return res.status(401).json({ error: 'Missing token' })
    }

    // verify logged in user
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token)

    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid user', details: userError })
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
      console.error('PROFILE ERROR', profileError)
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
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

    if (createError) {
      console.error('AUTH CREATE ERROR', createError)
      return res.status(400).json(createError)
    }

    const newUserId = newUser.user.id

    // insert profile
    const { error: profileInsertError } =
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUserId,
          full_name: name,
          role: 'driver'
        })

    if (profileInsertError) {
      console.error('PROFILE INSERT ERROR', profileInsertError)
      return res.status(500).json(profileInsertError)
    }

    // insert driver
    const { error: driverInsertError } =
      await supabaseAdmin
        .from('drivers')
        .insert({
          user_id: newUserId,
          status: 'active'
        })

    if (driverInsertError) {
      console.error('DRIVER INSERT ERROR', driverInsertError)
      return res.status(500).json(driverInsertError)
    }

    return res.status(200).json({ success: true })

  } catch (err) {

    console.error('CREATE DRIVER CRASH', err)

    return res.status(500).json({
      error: 'Server error',
      details: err.message
    })

  }

}
