import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Find memberships expiring in 3 days
    const { data: expiringMemberships, error: expiringError } = await supabase
      .from('user_memberships')
      .select(`
        *,
        plan:membership_plans(*),
        user:users(full_name, email)
      `)
      .eq('status', 'active')
      .gte('end_date', now.toISOString())
      .lte('end_date', threeDaysFromNow.toISOString());

    if (expiringError) {
      throw expiringError;
    }

    // Find expired memberships
    const { data: expiredMemberships, error: expiredError } = await supabase
      .from('user_memberships')
      .select(`
        *,
        plan:membership_plans(*),
        user:users(full_name, email)
      `)
      .eq('status', 'active')
      .lt('end_date', now.toISOString());

    if (expiredError) {
      throw expiredError;
    }

    // Send reminder emails for expiring memberships
    for (const membership of expiringMemberships || []) {
      const daysRemaining = Math.ceil((new Date(membership.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining === 3) {
        await supabase.functions.invoke('send-membership-email', {
          body: {
            type: 'reminder',
            userEmail: membership.user.email,
            userName: membership.user.full_name || 'User',
            planName: membership.plan?.name || 'Premium',
            endDate: new Date(membership.end_date).toLocaleDateString(),
            daysRemaining
          }
        });
      }
    }

    // Handle expired memberships
    for (const membership of expiredMemberships || []) {
      // Update status to expired
      await supabase
        .from('user_memberships')
        .update({ status: 'expired' })
        .eq('id', membership.id);

      // Send expiry email
      await supabase.functions.invoke('send-membership-email', {
        body: {
          type: 'expired',
          userEmail: membership.user.email,
          userName: membership.user.full_name || 'User',
          planName: membership.plan?.name || 'Premium',
          endDate: new Date(membership.end_date).toLocaleDateString()
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      processed: {
        expiring: expiringMemberships?.length || 0,
        expired: expiredMemberships?.length || 0
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error checking memberships:", error);
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