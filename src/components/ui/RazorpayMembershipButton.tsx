import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createMembershipPayment, verifyMembershipPayment } from '@/services/membershipService';
import { supabase } from '@/integrations/supabase/client';

interface RazorpayMembershipButtonProps {
  planId: string;
  userId: string;
  planName: string;
  amount: number;
  onSuccess?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayMembershipButton: React.FC<RazorpayMembershipButtonProps> = ({
  planId,
  userId,
  planName,
  amount,
  onSuccess,
  children,
  disabled = false,
  className = "",
  variant = "default"
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create payment order
      const paymentData = await createMembershipPayment(planId, userId);

      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Failed to create payment order');
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Motojojo Membership',
        description: `${planName} Membership`,
        order_id: paymentData.orderId,
        prefill: {
          name: paymentData.userDetails.name,
          email: paymentData.userDetails.email,
          contact: paymentData.userDetails.phone,
        },
        theme: {
          color: '#F37254',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verificationResult = await verifyMembershipPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              planId,
              userId
            );

            if (verificationResult.success) {
              toast({
                title: "Payment Successful!",
                description: verificationResult.message,
              });
              
              // Send welcome email after successful payment
              try {
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user?.email) {
                  await supabase.functions.invoke('send-membership-email', {
                    body: {
                      type: 'purchase',
                      userEmail: userData.user.email,
                      userName: userData.user.user_metadata?.full_name || 'User',
                      planName: planName,
                      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    }
                  });
                }
              } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
              }
              
              onSuccess?.();
            } else {
              throw new Error(verificationResult.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime",
            });
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
      variant={variant}
    >
      {loading ? 'Processing...' : children}
    </Button>
  );
};

export default RazorpayMembershipButton;