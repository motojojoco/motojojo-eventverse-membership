
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Experience {
  id: string;
  name: string;
  description: string;
  image: string;
  location?: string;
  city?: string;
}

const ExperiencesSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        // For now, we'll use an empty array since we don't have an experiences table yet
        // This can be implemented when you add the experiences table to Supabase
        setExperiences([]);
        
        // Uncomment and use this when you create an experiences table
        // const { data, error } = await supabase.from('experiences').select('*');
        // if (error) throw error;
        // setExperiences(data || []);
      } catch (error) {
        console.error("Error fetching experiences:", error);
        toast({
          title: "Error",
          description: "Failed to load experiences. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();

    // Setup real-time subscription when experiences table is created
    // const channel = supabase
    //   .channel('experiences-changes')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'experiences'
    //     },
    //     async (payload) => {
    //       console.log('Real-time update received:', payload);
    //       const { data } = await supabase.from('experiences').select('*');
    //       setExperiences(data || []);
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [toast]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 400;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/5">
        <div className="container-padding">
          <h2 className="section-title text-white">Curated Experiences</h2>
          <div className="flex justify-center py-16">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
              <div className="space-y-4 flex-1">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (experiences.length === 0) {
    return (
      <section className="py-16 bg-muted/5">
        <div className="container-padding">
          <h2 className="section-title text-white">Curated Experiences</h2>
          <div className="flex justify-center py-16">
            <p className="text-muted-foreground">No experiences available at this time. Please check back later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/5">
      <div className="container-padding">
        <FadeIn>
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title text-white">Curated Experiences</h2>
            <div className="hidden md:flex space-x-2">
              <Button 
                size="icon" 
                variant="outline" 
                className="rounded-full"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                className="rounded-full"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FadeIn>
        
        {/* Experiences Carousel */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        >
          {experiences.map((experience, index) => (
            <FadeIn key={experience.id} delay={100 * index}>
              <Link to={`/experiences/${experience.id}`}>
                <Card className="w-[300px] md:w-[350px] hover-scale cursor-pointer overflow-hidden border-none shadow-soft">
                  <div className="h-44 overflow-hidden">
                    <img 
                      src={experience.image} 
                      alt={experience.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-5 text-black">
                    {experience.location || experience.city ? (
                      <div className="text-black mb-1 text-base font-medium">
                        {experience.location ? experience.location : ''}
                        {experience.location && experience.city ? ', ' : ''}
                        {experience.city ? experience.city : ''}
                      </div>
                    ) : null}
                    <h3 className="text-lg font-bold mb-2">{experience.name}</h3>
                    <p className="text-sm">{experience.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperiencesSection;
