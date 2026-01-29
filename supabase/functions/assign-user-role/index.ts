import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if requesting user is admin
    const { data: adminCheck } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!adminCheck) {
      throw new Error('Only admins can assign roles');
    }

    const { userId, role, action } = await req.json();

    if (!userId || !role || !action) {
      throw new Error('Missing required fields: userId, role, action');
    }

    if (!['admin', 'producer', 'user'].includes(role)) {
      throw new Error('Invalid role');
    }

    if (!['add', 'remove'].includes(action)) {
      throw new Error('Invalid action');
    }

    if (action === 'add') {
      const { error } = await supabaseClient
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      // If adding producer role, ensure they have a producer profile with their email
      if (role === 'producer') {
        // Get user email from auth
        const { data: { user: targetUser } } = await supabaseClient.auth.admin.getUserById(userId);
        
        if (targetUser?.email) {
          // Check if producer with this email already exists
          const { data: existingProducer } = await supabaseClient
            .from('producers')
            .select('id')
            .eq('email', targetUser.email)
            .maybeSingle();

          if (!existingProducer) {
            // Create a new producer profile with basic info
            const displayName = targetUser.user_metadata?.display_name 
              || targetUser.email.split('@')[0];
            const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            const { error: createError } = await supabaseClient
              .from('producers')
              .insert({
                email: targetUser.email,
                name: displayName,
                slug: `${slug}-${Date.now()}`,
                country: 'Not specified',
                genre: 'Not specified',
                bio: 'New producer',
                image: '/placeholder.svg',
              });

            if (createError) {
              console.error('Error creating producer profile:', createError);
              // Don't throw - role was assigned successfully, producer profile creation is secondary
            } else {
              console.log(`Created producer profile for ${targetUser.email}`);
            }
          } else {
            console.log(`Producer profile already exists for ${targetUser.email}`);
          }
        }
      }
    } else {
      const { error } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: `Role ${action === 'add' ? 'assigned' : 'removed'} successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
