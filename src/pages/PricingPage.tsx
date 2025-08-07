import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Gift, Users, Calendar, Lock, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const premiumFeatures = [
  {
    icon: <Star className="h-5 w-5 text-yellow" />, 
    title: "Priority Access to Events",
    description: "Book tickets before anyone else and never miss out on your favorite experiences."
  },
  {
    icon: <Gift className="h-5 w-5 text-pink-500" />,
    title: "Exclusive Member-Only Events",
    description: "Attend special events curated just for Motojojo Premium members."
  },
  {
    icon: <Users className="h-5 w-5 text-blue-500" />,
    title: "VIP Community Access",
    description: "Join a premium community of event lovers, artists, and organizers."
  },
  {
    icon: <Calendar className="h-5 w-5 text-violet" />,
    title: "Personalized Event Recommendations",
    description: "Get tailored suggestions based on your interests and past bookings."
  },
  {
    icon: <Lock className="h-5 w-5 text-gray-500" />,
    title: "Ad-Free Experience",
    description: "Enjoy browsing and booking events without any interruptions."
  },
  {
    icon: <Clock className="h-5 w-5 text-green-500" />,
    title: "24/7 Premium Support",
    description: "Get priority customer support whenever you need help."
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
    title: "Special Discounts & Offers",
    description: "Unlock exclusive deals and discounts on select events."
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

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [myMembership, setMyMembership] = useState<any>(null);

  useEffect(() => {
    document.title = "Motojojo Premium | Pricing Plans";
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("duration_days", { ascending: true });
      if (error) {
        console.error("Error fetching plans:", error);
        const fallback: Plan[] = [
          { id: "fallback-30", name: "Monthly", duration_days: 30, price_inr: 500, description: null },
          { id: "fallback-90", name: "Quarterly", duration_days: 90, price_inr: 899, description: null },
          { id: "fallback-365", name: "Annual", duration_days: 365, price_inr: 1899, description: null },
        ];
        setPlans(fallback);
        setSelected(fallback[0]);
      } else {
        const list = data || [];
        setPlans(list);
        setSelected(list[0] || null);
      }
    };

    const fetchMembership = async () => {
      if (!user?.id) { setMyMembership(null); return; }
      const { data, error } = await supabase
        .from("user_memberships")
        .select("*, plan:membership_plans(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error) setMyMembership(data);
    };

    fetchPlans();
    fetchMembership();
  }, [user?.id]);

  const handleSubscribe = async (plan: Plan) => {
    if (!isSignedIn || !user?.id) {
      navigate("/auth");
      return;
    }
    const now = new Date();
    const end = myMembership?.end_date ? new Date(myMembership.end_date) : null;
    const start_date = end && end > now ? end.toISOString() : now.toISOString();

    const { data, error } = await supabase
      .from("user_memberships")
      .insert({ user_id: user.id, plan_id: plan.id, status: "active", start_date })
      .select("*, plan:membership_plans(*)")
      .single();

    if (error) {
      toast({ title: "Subscription failed", description: error.message });
      return;
    }
    toast({ title: "Premium activated!", description: `${plan.name} plan is now active.` });
    setMyMembership(data);
  };

  const daysRemaining = myMembership?.end_date ? Math.ceil((new Date(myMembership.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-raspberry p-4">
      <div className="w-full max-w-2xl mb-10">
        <h1 className="text-4xl font-bold text-sandstorm text-center mb-2">Motojojo Premium</h1>
        <div className="flex flex-col items-center mb-4">
          <p className="text-lg text-white/90 text-center max-w-xl">
            Unlock the best of Motojojo with exclusive features, early access, and a premium community experience.
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl mb-12">
        <div className="flex flex-col gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = myMembership?.plan?.id === plan.id && daysRemaining !== null && daysRemaining > 0;
            const ctaLabel = isCurrentPlan ? (daysRemaining && daysRemaining > 0 ? `Renew (starts after ${daysRemaining} day${daysRemaining === 1 ? '' : 's'})` : 'Renew') : 'Subscribe';
            return (
              <Card
                key={plan.id}
                className={`transition-all duration-200 ${selected?.id === plan.id ? "border-sandstorm ring-4 ring-sandstorm/60" : "border-gray-200 hover:scale-105"} bg-sandstorm/90`}
                onClick={() => setSelected(plan)}
                tabIndex={0}
                role="button"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl text-violet font-extrabold">{plan.name}</CardTitle>
                    <Badge className="bg-yellow text-black text-xs px-2 py-1 rounded-full">{plan.duration_days} days</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-black">₹{plan.price_inr}</div>
                  <div className="text-base text-violet mt-2">{plan.description || "All-access to premium features and experiences."}</div>
                  <Button className="w-full mt-4 bg-gradient-to-r from-yellow to-orange-400 text-black font-bold text-lg py-2"
                    onClick={(e) => { e.stopPropagation(); handleSubscribe(plan); }}
                  >
                    {ctaLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-3xl mb-12">
        <h2 className="text-2xl font-bold text-sandstorm text-center mb-6">Premium Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {premiumFeatures.map((feature) => (
            <Card key={feature.title} className="bg-white/90 border-0 shadow-md flex flex-row items-center gap-4 p-4">
              {feature.icon}
              <div>
                <div className="font-semibold text-lg mb-1">{feature.title}</div>
                <div className="text-muted-foreground text-base">{feature.description}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl mb-12">
        <h3 className="text-xl font-bold text-sandstorm text-center mb-4">My Membership</h3>
        {myMembership ? (
          <Card className="bg-white/90 border-0 shadow-md p-4">
            <div className="text-violet font-semibold">{myMembership.plan?.name} • ₹{myMembership.amount_inr} • {myMembership.status}</div>
            <div className="text-black text-sm mt-1">
              Valid {new Date(myMembership.start_date).toLocaleDateString()} — {new Date(myMembership.end_date).toLocaleDateString()}
            </div>
            {daysRemaining !== null && (
              <div className="text-sm text-black mt-1">{daysRemaining > 0 ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining` : 'Expired'}</div>
            )}
          </Card>
        ) : (
          <div className="text-center text-white/90">No membership yet. Pick a plan above.</div>
        )}
      </div>
    </div>
  );
}