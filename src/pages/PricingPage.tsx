import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Gift, Users, Calendar, Lock, Clock, TrendingUp, Crown, Zap, Shield, Sparkles, Home, Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import RazorpayMembershipButton from "@/components/ui/RazorpayMembershipButton";
import { getMembershipPlans } from "@/services/membershipService";
import { useMembership } from "@/hooks/use-membership";

const premiumFeatures = [
  {
    icon: <Star className="h-6 w-6" />, 
    title: "Priority Access to Events",
    description: "Book tickets before anyone else and never miss out on your favorite experiences.",
    highlight: true
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: "Exclusive Member-Only Events",
    description: "Attend special events curated just for Motojojo Premium members.",
    highlight: true
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "VIP Community Access",
    description: "Join a premium community of event lovers, artists, and organizers.",
    highlight: false
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Personalized Event Recommendations",
    description: "Get tailored suggestions based on your interests and past bookings.",
    highlight: false
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Ad-Free Experience",
    description: "Enjoy browsing and booking events without any interruptions.",
    highlight: false
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "24/7 Premium Support",
    description: "Get priority customer support whenever you need help.",
    highlight: false
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Special Discounts & Offers",
    description: "Unlock exclusive deals and discounts on select events.",
    highlight: true
  },
  {
    icon: <Crown className="h-6 w-6" />,
    title: "Premium Badge & Status",
    description: "Show off your premium status with exclusive badges and profile perks.",
    highlight: false
  },
];

type Plan = {
  id: string;
  name: string;
  duration_days: number;
  price_inr: number;
  description?: string | null;
};

export default function PricingPage() {
  const { isSignedIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { membership: myMembership, daysRemaining, refreshMembership } = useMembership();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);

  const fetchPlans = async () => {
    const plansData = await getMembershipPlans();
    if (plansData.length > 0) {
      setPlans(plansData);
      setSelected(plansData[0]);
    } else {
      // Fallback plans
      const fallback: Plan[] = [
        { id: "fallback-30", name: "Monthly", duration_days: 30, price_inr: 500, description: null },
        { id: "fallback-90", name: "Quarterly", duration_days: 90, price_inr: 899, description: null },
        { id: "fallback-365", name: "Annual", duration_days: 365, price_inr: 1899, description: null },
      ];
      setPlans(fallback);
      setSelected(fallback[0]);
    }
  };

  useEffect(() => {
    document.title = "Motojojo Premium | Pricing Plans";
    fetchPlans();
  }, []);

  const handlePaymentSuccess = async () => {
    // Refresh membership data in real-time
    refreshMembership();
    
    // Send welcome email
    if (user?.email && user?.user_metadata?.full_name) {
      try {
        await supabase.functions.invoke('send-membership-email', {
          body: {
            type: 'purchase',
            userEmail: user.email,
            userName: user.user_metadata.full_name || 'User',
            planName: selected?.name || 'Premium',
            endDate: new Date(Date.now() + (selected?.duration_days || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()
          }
        });
      } catch (error) {
        console.error('Error sending welcome email:', error);
      }
    }
    
    toast({
      title: "Premium Activated!",
      description: "Welcome to Motojojo Premium! Enjoy exclusive features.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-violet/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet/5 via-transparent to-sandstorm/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sandstorm/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <Crown className="h-12 w-12 text-sandstorm mr-4" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-sandstorm via-white to-violet/80 bg-clip-text text-transparent">
              Premium
            </h1>
            <Sparkles className="h-12 w-12 text-sandstorm ml-4" />
          </div>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Unlock the best of Motojojo with exclusive features, early access, and a premium community experience.
          </p>
          {myMembership && (
            <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-sandstorm/20 to-violet/20 backdrop-blur-sm border border-sandstorm/30 rounded-full px-6 py-3">
              <CheckCircle className="h-5 w-5 text-sandstorm" />
              <span className="text-white font-medium">Premium Member</span>
              {daysRemaining !== null && daysRemaining > 0 && (
                <Badge variant="secondary" className="bg-sandstorm/20 text-sandstorm border-sandstorm/30">
                  {daysRemaining} days left
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const isCurrentPlan = myMembership?.plan?.id === plan.id && daysRemaining !== null && daysRemaining > 0;
              const isPopular = index === 1; // Middle plan is most popular
              const ctaLabel = isCurrentPlan ? 
                (daysRemaining && daysRemaining > 0 ? `Renew (starts after ${daysRemaining} day${daysRemaining === 1 ? '' : 's'})` : 'Renew') : 
                'Get Premium';
              
              return (
                <Card
                  key={plan.id}
                  className={`relative group transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                    isPopular 
                      ? 'bg-gradient-to-b from-sandstorm/10 to-violet/10 border-2 border-sandstorm shadow-glow-yellow scale-105' 
                      : 'bg-white/5 backdrop-blur-sm border border-white/20'
                  } ${selected?.id === plan.id ? 'ring-2 ring-sandstorm' : ''}`}
                  onClick={() => setSelected(plan)}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-sandstorm to-violet text-black font-bold px-4 py-1 text-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-white mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-black text-sandstorm">₹{plan.price_inr}</span>
                      <span className="text-white/60 ml-2">/ {plan.duration_days} days</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {plan.description || "All-access to premium features and experiences."}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {isSignedIn && user?.id ? (
                      <RazorpayMembershipButton
                        planId={plan.id}
                        userId={user.id}
                        planName={plan.name}
                        amount={plan.price_inr}
                        onSuccess={handlePaymentSuccess}
                        className={`w-full mb-6 font-bold text-lg py-3 transition-all duration-300 ${
                          isPopular 
                            ? 'bg-gradient-to-r from-sandstorm to-violet text-black hover:shadow-glow-yellow' 
                            : 'bg-gradient-to-r from-white/10 to-white/20 text-white border border-white/30 hover:bg-white/20'
                        }`}
                      >
                        {ctaLabel}
                      </RazorpayMembershipButton>
                    ) : (
                      <Button 
                        className={`w-full mb-6 font-bold text-lg py-3 transition-all duration-300 ${
                          isPopular 
                            ? 'bg-gradient-to-r from-sandstorm to-violet text-black hover:shadow-glow-yellow' 
                            : 'bg-gradient-to-r from-white/10 to-white/20 text-white border border-white/30 hover:bg-white/20'
                        }`}
                        onClick={() => navigate("/auth", { state: { returnTo: '/pricing' } })}
                      >
                        Sign In to Subscribe
                      </Button>
                    )}
                    
                    {/* Quick Features Preview */}
                    <div className="space-y-3">
                      {premiumFeatures.slice(0, 4).map((feature) => (
                        <div key={feature.title} className="flex items-center gap-3 text-sm">
                          <CheckCircle className="h-4 w-4 text-sandstorm flex-shrink-0" />
                          <span className="text-white/80">{feature.title}</span>
                        </div>
                      ))}
                      <div className="text-center pt-2">
                        <span className="text-sandstorm text-sm font-medium">+ {premiumFeatures.length - 4} more features</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Discover all the premium features that will transform your event experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <Card 
                key={feature.title} 
                className={`group transition-all duration-500 hover:scale-105 ${
                  feature.highlight 
                    ? 'bg-gradient-to-br from-sandstorm/10 to-violet/10 border border-sandstorm/30 shadow-glow-yellow/30' 
                    : 'bg-white/5 backdrop-blur-sm border border-white/20'
                } hover:shadow-2xl animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${
                    feature.highlight 
                      ? 'bg-gradient-to-br from-sandstorm/20 to-violet/20 text-sandstorm' 
                      : 'bg-white/10 text-white'
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                  {feature.highlight && (
                    <div className="mt-3">
                      <Badge variant="secondary" className="bg-sandstorm/20 text-sandstorm border-sandstorm/30 text-xs">
                        Popular
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Current Membership Status */}
        {myMembership && (
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="bg-gradient-to-r from-sandstorm/10 to-violet/10 border border-sandstorm/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-sandstorm" />
                  My Premium Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-xl font-bold text-sandstorm">{myMembership.plan?.name} Plan</div>
                  <div className="text-white/80">₹{myMembership.amount_inr} • {myMembership.status}</div>
                  <div className="text-white/60 text-sm">
                    Valid from {new Date(myMembership.start_date).toLocaleDateString()} to {new Date(myMembership.end_date).toLocaleDateString()}
                  </div>
                  {daysRemaining !== null && (
                    <div className={`text-sm font-medium ${daysRemaining > 7 ? 'text-green-400' : daysRemaining > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining` : 'Expired'}
                    </div>
                  )}
                </div>
                
                {/* Renew Button */}
                {user?.id && myMembership.plan && (
                  <RazorpayMembershipButton
                    planId={myMembership.plan.id}
                    userId={user.id}
                    planName={myMembership.plan.name}
                    amount={myMembership.plan.price_inr}
                    onSuccess={handlePaymentSuccess}
                    className="bg-gradient-to-r from-sandstorm to-violet text-black hover:shadow-glow-yellow font-bold px-8 py-3"
                  >
                    Renew Plan
                  </RazorpayMembershipButton>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm border-t border-border shadow-lg" style={{ backgroundColor: '#F7E1B5' }}>
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-black" onClick={() => navigate("/")}>
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-black" onClick={() => navigate("/events")}>
            <span className="text-xs">Events</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-violet bg-yellow-300/30 shadow-md" onClick={() => navigate("/pricing")}>
            <Crown className="h-5 w-5" />
            <span className="text-xs font-medium">Premium</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-black" onClick={() => navigate("/profile?tab=bookings")}>
            <span className="text-xs">Bookings</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-black" onClick={() => navigate("/profile")}>
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}