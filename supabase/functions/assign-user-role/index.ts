import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

          let isNewProducer = false;
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
            } else {
              console.log(`Created producer profile for ${targetUser.email}`);
              isNewProducer = true;
            }
          } else {
            console.log(`Producer profile already exists for ${targetUser.email}`);
          }

          // Send welcome email to new producer
          try {
            const displayName = targetUser.user_metadata?.display_name 
              || targetUser.email.split('@')[0];
            
            const { error: emailError } = await resend.emails.send({
              from: 'Hecho En America <team@hechoenamericastudio.com>',
              to: [targetUser.email],
              subject: '🎉 Welcome to the Hecho En America Producer Team!',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to the Team! 🎵</h1>
                  </div>
                  
                  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px;">Hi <strong>${displayName}</strong>,</p>
                    
                    <p style="font-size: 16px;">Congratulations! You've been granted <strong>Producer</strong> permissions on the Hecho En America platform.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #667eea;">What you can do now:</h3>
                      <ul style="margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Access your <strong>Producer Dashboard</strong> to view assigned projects</li>
                        <li style="margin-bottom: 8px;">Update your <strong>Producer Profile</strong> with your bio, social links, and photo</li>
                        <li style="margin-bottom: 8px;">Connect your <strong>Google Drive</strong> for file delivery</li>
                        <li style="margin-bottom: 8px;">Set up <strong>Stripe Connect</strong> to receive payments</li>
                        <li style="margin-bottom: 0;">Receive project assignments via <strong>Discord</strong></li>
                      </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://hechoenamerica.lovable.app/producer-profile" 
                         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Complete Your Profile →
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">
                      <strong>Important:</strong> Make sure to add your Discord User ID in your profile settings to receive project notifications!
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #888; text-align: center; margin: 0;">
                      Questions? Reply to this email or contact us at team@hechoenamericastudio.com
                    </p>
                  </div>
                </body>
                </html>
              `,
            });

            if (emailError) {
              console.error('Error sending welcome email:', emailError);
            } else {
              console.log(`Welcome email sent to ${targetUser.email}`);
            }
          } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
            // Don't throw - email is not critical
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
