import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'purchase' | 'reminder' | 'expired';
  userEmail: string;
  userName: string;
  planName: string;
  endDate?: string;
  daysRemaining?: number;
}

const getEmailTemplate = (type: string, userName: string, planName: string, endDate?: string, daysRemaining?: number) => {
  switch (type) {
    case 'purchase':
      return {
        subject: `Welcome to Motojojo ${planName} Plan! 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #F7E1B5, #E91E63); padding: 30px; border-radius: 12px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to Premium! 🎉</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 12px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}!</h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Congratulations! You've successfully subscribed to the <strong>${planName} Plan</strong>. 
                Welcome to the exclusive world of Motojojo Premium!
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E91E63;">
                <h3 style="color: #E91E63; margin-top: 0;">What you get:</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>✨ Priority Access to Events</li>
                  <li>🎁 Exclusive Member-Only Events</li>
                  <li>👥 VIP Community Access</li>
                  <li>🎯 Personalized Event Recommendations</li>
                  <li>🛡️ Ad-Free Experience</li>
                  <li>⏰ 24/7 Premium Support</li>
                  <li>💰 Special Discounts & Offers</li>
                  <li>👑 Premium Badge & Status</li>
                </ul>
              </div>
              <p style="color: #666; line-height: 1.6;">
                Your membership is valid until <strong>${endDate}</strong>. We'll remind you before it expires.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vibruvwwwxqtagmlkodq.supabase.co" style="background: linear-gradient(135deg, #E91E63, #F7E1B5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                  Explore Premium Features
                </a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
              <p>Thank you for choosing Motojojo Premium!</p>
            </div>
          </div>
        `
      };
    
    case 'reminder':
      return {
        subject: `Your Motojojo Premium expires in ${daysRemaining} days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #F7E1B5, #E91E63); padding: 30px; border-radius: 12px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Renewal Reminder ⏰</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 12px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}!</h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Your <strong>${planName} Plan</strong> will expire in <strong>${daysRemaining} days</strong> on ${endDate}.
              </p>
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                  <strong>Don't miss out!</strong> Renew now to continue enjoying all premium features.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vibruvwwwxqtagmlkodq.supabase.co/pricing" style="background: linear-gradient(135deg, #E91E63, #F7E1B5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                  Renew Membership
                </a>
              </div>
            </div>
          </div>
        `
      };

    case 'expired':
      return {
        subject: `Your Motojojo Premium has expired`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6c757d, #495057); padding: 30px; border-radius: 12px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Membership Expired</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 12px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}!</h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Your <strong>${planName} Plan</strong> has expired on ${endDate}. We hope you enjoyed the premium experience!
              </p>
              <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 0; color: #721c24;">
                  Your account has been switched back to the free plan. You can reactivate premium anytime!
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vibruvwwwxqtagmlkodq.supabase.co/pricing" style="background: linear-gradient(135deg, #E91E63, #F7E1B5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                  Reactivate Premium
                </a>
              </div>
            </div>
          </div>
        `
      };

    default:
      return { subject: '', html: '' };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { type, userEmail, userName, planName, endDate, daysRemaining }: EmailRequest = await req.json();

    const resend = new Resend(resendKey);
    const template = getEmailTemplate(type, userName, planName, endDate, daysRemaining);

    const { data, error } = await resend.emails.send({
      from: "Motojojo <noreply@resend.dev>",
      to: [userEmail],
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});