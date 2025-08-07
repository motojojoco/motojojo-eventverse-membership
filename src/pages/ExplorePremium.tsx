import { useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Gift, Users, Calendar, Lock, Clock, TrendingUp } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import { useNavigate } from "react-router-dom";
const premiumFeatures = [
  {
    icon: <Star className="h-6 w-6 text-yellow" />, 
    title: "Priority Access to Events",
    description: "Book tickets before anyone else and never miss out on your favorite experiences."
  },
  {
    icon: <Gift className="h-6 w-6 text-pink-500" />,
    title: "Exclusive Member-Only Events",
    description: "Attend special events curated just for Motojojo Premium members."
  },
  {
    icon: <Users className="h-6 w-6 text-blue-500" />,
    title: "VIP Community Access",
    description: "Join a premium community of event lovers, artists, and organizers."
  },
  {
    icon: <Calendar className="h-6 w-6 text-violet" />,
    title: "Personalized Event Recommendations",
    description: "Get tailored suggestions based on your interests and past bookings."
  },
  {
    icon: <Lock className="h-6 w-6 text-gray-500" />,
    title: "Ad-Free Experience",
    description: "Enjoy browsing and booking events without any interruptions."
  },
  {
    icon: <Clock className="h-6 w-6 text-green-500" />,
    title: "24/7 Premium Support",
    description: "Get priority customer support whenever you need help."
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-orange-500" />,
    title: "Special Discounts & Offers",
    description: "Unlock exclusive deals and discounts on select events."
  },
];

const ExplorePremium = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Motojojo Premium | Choose Your Plan";
  }, []);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8 pb-20 md:pb-8 bg-gradient-to-b from-background/80 to-muted/40">
        <div className="container-padding">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Motojojo <span className="text-gradient">Premium</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                Unlock the best of Motojojo with exclusive features, early access, and a premium community experience.
              </p>
              <Badge className="bg-yellow text-black text-base px-4 py-2 rounded-full mb-2">Coming Soon</Badge>
            </div>
          </FadeIn>

          <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
            <FadeIn delay={100}>
              <Card className="w-full max-w-md shadow-lg border-2 border-yellow">
                <CardHeader className="flex flex-col items-center">
                  <CardTitle className="text-3xl font-bold mb-2">Premium Membership</CardTitle>
                  <CardDescription className="text-lg mb-4">All-access pass to the best events and experiences</CardDescription>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl font-bold">₹499</span>
                    <span className="text-muted-foreground">/ year</span>
                  </div>
                  <Badge className="bg-yellow text-black text-base px-3 py-1 rounded-full">Coming Soon</Badge>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Button className="w-full bg-gradient-to-r from-yellow to-orange-400 text-black font-bold text-lg py-3 mt-4"
                    onClick={() => navigate('/pricing')}
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          <FadeIn delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {premiumFeatures.map((feature, idx) => (
                <Card key={feature.title} className="shadow-md border-0 bg-white/90">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <div>
                      <CardTitle className="text-lg font-semibold mb-1">{feature.title}</CardTitle>
                      <CardDescription className="text-muted-foreground text-base">{feature.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="text-center mt-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Motojojo Premium is launching soon!</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Stay tuned for updates and be the first to experience the next level of events and entertainment.
              </p>
              <Button className="bg-gradient-to-r from-yellow to-orange-400 text-black font-bold text-lg px-8 py-3"
                onClick={() => navigate('/pricing')}
              >
                See Plans
              </Button>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExplorePremium;
