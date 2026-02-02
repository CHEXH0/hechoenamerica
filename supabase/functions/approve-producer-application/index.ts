import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ApplicationData {
  type: string;
  genres: string[];
  bio: string;
  image_url: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
  instagram_url?: string;
  website_url?: string;
}

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
      throw new Error('Only admins can approve producer applications');
    }

    const { applicationId, action } = await req.json();

    if (!applicationId || !action) {
      throw new Error('Missing required fields: applicationId, action');
    }

    if (!['approve', 'reject'].includes(action)) {
      throw new Error('Invalid action. Must be "approve" or "reject"');
    }

    // Fetch the application
    const { data: application, error: fetchError } = await supabaseClient
      .from('contact_submissions')
      .select('*')
      .eq('id', applicationId)
      .eq('subject', 'Producer Application')
      .single();

    if (fetchError || !application) {
      console.error('Error fetching application:', fetchError);
      throw new Error('Application not found');
    }

    if (application.application_status !== 'pending') {
      throw new Error('Application has already been processed');
    }

    // Parse the application data from the message JSON
    let appData: ApplicationData;
    try {
      appData = JSON.parse(application.message);
    } catch (e) {
      throw new Error('Invalid application data format');
    }

    if (action === 'reject') {
      // Update application status to rejected
      const { error: updateError } = await supabaseClient
        .from('contact_submissions')
        .update({ application_status: 'rejected' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Send rejection email
      try {
        await resend.emails.send({
          from: 'Hecho En America <team@hechoenamericastudio.com>',
          to: [application.email],
          subject: 'Producer Application Update - Hecho En América',
          html: `
            <p>Hi ${application.name},</p>
            <p>Thank you for your interest in joining the Hecho En América producer network.</p>
            <p>After careful consideration, we've decided not to move forward with your application at this time.</p>
            <p>We encourage you to continue developing your craft and apply again in the future.</p>
            <p>Best regards,<br>The Hecho En América Team</p>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Application rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // APPROVE FLOW
    if (!application.user_id) {
      throw new Error('Cannot approve application: No user account linked. The applicant must create an account first.');
    }

    // Get the applicant's user info
    const { data: { user: applicantUser } } = await supabaseClient.auth.admin.getUserById(application.user_id);
    
    if (!applicantUser) {
      throw new Error('Applicant user account not found');
    }

    // 1. Assign producer role to the user
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({ user_id: application.user_id, role: 'producer' })
      .select()
      .single();

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('Error assigning role:', roleError);
      throw new Error('Failed to assign producer role');
    }

    // 2. Create the producer profile with application data
    const displayName = application.name;
    const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    
    // Check if producer with this email already exists
    const { data: existingProducer } = await supabaseClient
      .from('producers')
      .select('id')
      .eq('email', applicantUser.email)
      .maybeSingle();

    if (!existingProducer) {
      const { error: producerError } = await supabaseClient
        .from('producers')
        .insert({
          email: applicantUser.email,
          name: displayName,
          slug: slug,
          country: application.country || 'Not specified',
          genre: appData.genres?.join(', ') || 'Not specified',
          bio: appData.bio || 'Producer at Hecho En América',
          image: appData.image_url || '/placeholder.svg',
          spotify_url: appData.spotify_url || null,
          youtube_url: appData.youtube_url || null,
          apple_music_url: appData.apple_music_url || null,
          instagram_url: appData.instagram_url || null,
          website_url: appData.website_url || null,
        });

      if (producerError) {
        console.error('Error creating producer profile:', producerError);
        throw new Error('Failed to create producer profile');
      }

      console.log(`Created producer profile for ${applicantUser.email} with application data`);
    } else {
      // Update existing producer with application data
      const { error: updateProdError } = await supabaseClient
        .from('producers')
        .update({
          name: displayName,
          country: application.country || undefined,
          genre: appData.genres?.join(', ') || undefined,
          bio: appData.bio || undefined,
          image: appData.image_url || undefined,
          spotify_url: appData.spotify_url || undefined,
          youtube_url: appData.youtube_url || undefined,
          apple_music_url: appData.apple_music_url || undefined,
          instagram_url: appData.instagram_url || undefined,
          website_url: appData.website_url || undefined,
        })
        .eq('id', existingProducer.id);

      if (updateProdError) {
        console.error('Error updating producer profile:', updateProdError);
      }
    }

    // 3. Update application status to approved
    const { error: statusError } = await supabaseClient
      .from('contact_submissions')
      .update({ application_status: 'approved' })
      .eq('id', applicationId);

    if (statusError) {
      console.error('Error updating application status:', statusError);
    }

    // 4. Send approval email
    try {
      await resend.emails.send({
        from: 'Hecho En America <team@hechoenamericastudio.com>',
        to: [applicantUser.email!],
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
              
              <p style="font-size: 16px;">Great news! Your producer application has been <strong>approved</strong>! You now have full producer permissions on the Hecho En America platform.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #667eea;">What you can do now:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Access your <strong>Producer Dashboard</strong> to view assigned projects</li>
                  <li style="margin-bottom: 8px;">Your profile has been set up with your application info</li>
                  <li style="margin-bottom: 8px;">Connect your <strong>Google Drive</strong> for file delivery</li>
                  <li style="margin-bottom: 8px;">Set up <strong>Stripe Connect</strong> to receive payments</li>
                  <li style="margin-bottom: 0;">Receive project assignments via <strong>Discord</strong></li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://hechoenamericastudio.com/producer-profile" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Go to Your Dashboard →
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
      console.log(`Approval email sent to ${applicantUser.email}`);
    } catch (emailErr) {
      console.error('Failed to send approval email:', emailErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Producer application approved successfully!' }),
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
