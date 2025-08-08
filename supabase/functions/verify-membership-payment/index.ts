import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentId, orderId, signature, planId, userId } = await req.json()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify Razorpay signature
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const body = orderId + '|' + paymentId
    const expectedSignature = createHmac('sha256', razorpaySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      throw new Error('Invalid payment signature')
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      throw new Error('Plan not found')
    }

    // Check if user already has an active membership
    const { data: existingMembership } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    let startDate = new Date()
    
    // If user has existing membership, extend from end date
    if (existingMembership && new Date(existingMembership.end_date) > new Date()) {
      startDate = new Date(existingMembership.end_date)
    }

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + plan.duration_days)

    // Create new membership record
    const { error: membershipError } = await supabase
      .from('user_memberships')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount_inr: plan.price_inr,
        payment_id: paymentId
      })

    if (membershipError) {
      throw new Error(`Failed to create membership: ${membershipError.message}`)
    }

    // Update existing memberships to expired if any
    if (existingMembership) {
      await supabase
        .from('user_memberships')
        .update({ status: 'expired' })
        .eq('id', existingMembership.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Membership activated successfully',
        membershipDetails: {
          planName: plan.name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          amount: plan.price_inr
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error verifying membership payment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})