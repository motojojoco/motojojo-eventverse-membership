import { supabase } from "@/integrations/supabase/client";

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  duration_days: number;
  is_active: boolean;
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'expired';
  start_date: string;
  end_date: string;
  amount_inr: number;
  payment_id?: string;
  plan?: MembershipPlan;
}

export const getMembershipPlans = async (): Promise<MembershipPlan[]> => {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_inr', { ascending: true });

  if (error) {
    console.error('Error fetching membership plans:', error);
    return [];
  }

  return data || [];
};

export const getUserMembership = async (userId: string): Promise<UserMembership | null> => {
  const { data, error } = await supabase
    .from('user_memberships')
    .select(`
      *,
      plan:membership_plans(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error) {
    console.error('Error fetching user membership:', error);
    return null;
  }

  return data ? {
    ...data,
    status: data.status as "pending" | "active" | "expired"
  } : null;
};

// Real-time subscription for membership changes
export const subscribeToMembershipChanges = (userId: string, callback: (membership: UserMembership | null) => void) => {
  return supabase
    .channel(`membership_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_memberships',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Fetch updated membership when changes occur
        const membership = await getUserMembership(userId);
        callback(membership);
      }
    )
    .subscribe();
};

export const createMembershipPayment = async (planId: string, userId: string) => {
  const { data, error } = await supabase.functions.invoke('create-membership-payment', {
    body: { planId, userId }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const verifyMembershipPayment = async (
  paymentId: string,
  orderId: string,
  signature: string,
  planId: string,
  userId: string
) => {
  const { data, error } = await supabase.functions.invoke('verify-membership-payment', {
    body: { paymentId, orderId, signature, planId, userId }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Save user details during membership purchase
export const saveUserMembershipDetails = async (
  userId: string,
  planId: string,
  paymentId: string,
  userDetails: {
    full_name?: string;
    phone?: string;
    city?: string;
    email?: string;
  }
) => {
  // Update user profile with any new details
  if (userDetails.full_name || userDetails.phone || userDetails.city) {
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: userDetails.full_name,
        phone: userDetails.phone,
        city: userDetails.city,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user details:', userError);
    }
  }

  return true;
};