import { useEffect, useState } from 'react';
import { getUserMembership, subscribeToMembershipChanges, UserMembership } from '@/services/membershipService';
import { useAuth } from '@/hooks/use-auth';

export const useMembership = () => {
  const { user } = useAuth();
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const calculateDaysRemaining = (endDate: string) => {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const fetchMembership = async () => {
    if (!user?.id) {
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      const membershipData = await getUserMembership(user.id);
      setMembership(membershipData);
      
      if (membershipData?.end_date) {
        setDaysRemaining(calculateDaysRemaining(membershipData.end_date));
      } else {
        setDaysRemaining(null);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setMembership(null);
      setDaysRemaining(null);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchMembership();

    // Set up real-time subscription
    const subscription = subscribeToMembershipChanges(user.id, (updatedMembership) => {
      setMembership(updatedMembership);
      
      if (updatedMembership?.end_date) {
        setDaysRemaining(calculateDaysRemaining(updatedMembership.end_date));
      } else {
        setDaysRemaining(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const refreshMembership = () => {
    fetchMembership();
  };

  return {
    membership,
    loading,
    daysRemaining,
    refreshMembership,
    isActive: membership?.status === 'active' && (daysRemaining === null || daysRemaining > 0),
    isExpiringSoon: daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0,
    isExpired: daysRemaining !== null && daysRemaining <= 0
  };
};