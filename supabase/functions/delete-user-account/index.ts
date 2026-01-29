import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a user client to validate the JWT using getClaims
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user's JWT token using getClaims (validates signature without session check)
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)

    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation error:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token - no user ID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting account deletion for user: ${userId}`)

    // Get user email for producer cleanup
    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const userEmail = targetUser?.email

    // Delete user's purchases
    const { error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .delete()
      .eq('user_id', userId)
    if (purchasesError) console.error('Error deleting purchases:', purchasesError)
    else console.log('Deleted user purchases')

    // Delete user's song requests
    const { error: songRequestsError } = await supabaseAdmin
      .from('song_requests')
      .delete()
      .eq('user_id', userId)
    if (songRequestsError) console.error('Error deleting song requests:', songRequestsError)
    else console.log('Deleted user song requests')

    // Delete user's AI song generations
    const { error: aiGenError } = await supabaseAdmin
      .from('ai_song_generations')
      .delete()
      .eq('user_id', userId)
    if (aiGenError) console.error('Error deleting AI generations:', aiGenError)
    else console.log('Deleted AI song generations')

    // Delete user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (profileError) console.error('Error deleting profile:', profileError)
    else console.log('Deleted user profile')

    // Delete user's roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (rolesError) console.error('Error deleting user roles:', rolesError)
    else console.log('Deleted user roles')

    // Delete producer Google tokens if they exist
    const { error: tokensError } = await supabaseAdmin
      .from('producer_google_tokens')
      .delete()
      .eq('user_id', userId)
    if (tokensError) console.error('Error deleting Google tokens:', tokensError)
    else console.log('Deleted Google tokens')

    // Delete producer profile if email matches
    if (userEmail) {
      const { error: producerError } = await supabaseAdmin
        .from('producers')
        .delete()
        .eq('email', userEmail)
      if (producerError) console.error('Error deleting producer profile:', producerError)
      else console.log('Deleted producer profile')
    }

    // Delete user's files from storage buckets
    // Delete from product-assets (song files)
    try {
      const { data: songFiles } = await supabaseAdmin.storage
        .from('product-assets')
        .list(`songs/${userId}`)
      
      if (songFiles && songFiles.length > 0) {
        const filePaths = songFiles.map(file => `songs/${userId}/${file.name}`)
        await supabaseAdmin.storage
          .from('product-assets')
          .remove(filePaths)
        console.log(`Deleted ${filePaths.length} files from product-assets`)
      }
    } catch (storageError) {
      console.error('Error deleting storage files:', storageError)
    }

    // Finally, delete the user account from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
