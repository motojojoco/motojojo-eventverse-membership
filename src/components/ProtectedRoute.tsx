
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  hostOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly, hostOnly }) => {
  const { isSignedIn, isLoaded, isAdmin, isHost } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const currentPath = window.location.pathname + window.location.search;
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this page.",
      });
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    } else if (isLoaded && adminOnly && !isAdmin) {
      toast({
        title: "Admin Access Required",
        description: "You do not have permission to access this page.",
        variant: "destructive"
      });
      navigate("/");
    } else if (isLoaded && hostOnly && !isHost) {
      toast({
        title: "Host Access Required",
        description: "You do not have permission to access this page.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [isLoaded, isSignedIn, isAdmin, adminOnly, navigate, toast]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md mx-auto p-6">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn || (adminOnly && !isAdmin) || (hostOnly && !isHost)) {
    return null; // We'll redirect in the useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;
