import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, User, Menu, X, ShoppingCart, Ticket, Home, Calendar, Heart, Settings, MessageSquare, History, LogOut } from "lucide-react";
import { cities } from "@/data/mockData";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/cart-store";

type NavbarProps = {
  selectedCity?: string;
  setSelectedCity?: (city: string) => void;
  bgColor?: string; // Optional background color override
  logoSrc?: string; // Optional logo override
};

const Navbar = ({ selectedCity, setSelectedCity, bgColor, logoSrc }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, isAdmin, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = useCartStore(state => state.getTotalItems());
  const [searchValue, setSearchValue] = useState("");
  const [internalCity, setInternalCity] = useState<string>(() => localStorage.getItem("selectedCity") || "Mumbai");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Persist internal city if using internal state
  useEffect(() => {
    if (!selectedCity) {
      localStorage.setItem("selectedCity", internalCity);
    }
  }, [internalCity, selectedCity]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Handle navigation with authentication check
  const handleAuthenticatedNavigation = (path: string) => {
    if (!isSignedIn) {
      navigate("/auth");
    } else {
      navigate(path);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchValue.trim().toLowerCase();
    const cityMatch = cities.find(city => city.name.toLowerCase() === keyword);
    if (cityMatch) {
      navigate(`/events?city=${encodeURIComponent(cityMatch.name)}`);
    } else if (keyword) {
      navigate(`/events?search=${encodeURIComponent(searchValue)}`);
    }
    setSearchValue("");
  };

  return (
    <>
      {/* Top Header - Simplified for mobile */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? (bgColor ? '' : 'bg-background/95') + ' backdrop-blur-sm shadow-md py-2' 
            : (bgColor ? '' : 'bg-transparent py-4')
        }`}
        style={bgColor ? { backgroundColor: bgColor, ...(isScrolled ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : {}), paddingTop: isScrolled ? '0.5rem' : '1rem', paddingBottom: isScrolled ? '0.5rem' : '1.5rem' } : {}}
      >
        {/* Responsive container with max width and horizontal centering */}
        <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between px-2 md:px-6 lg:px-8">
          {/* Logo - responsive and doesn't push nav items out */}
          <Link to="/" className="flex items-center flex-shrink-0 m-0 p-0 min-w-0">
            <img src={logoSrc || "/motojojo.png"} alt="Logo" className="h-16 w-16 md:h-24 md:w-24 lg:h-28 lg:w-28 max-w-none m-0 p-0" />
          </Link>

          {/* Desktop Nav Items - wrap and space items, allow shrinking */}
          <div className="hidden md:flex flex-wrap items-center gap-3 min-w-0 flex-1 justify-end">
            {/* Search Bar */}
            <form className="relative w-64 min-w-0" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mapcream h-4 w-4" />
              <Input
                placeholder="Search experiences, artists, venues..."
                className="pl-10 bg-muted/30 border-none focus-visible:ring-violet hover:bg-muted/50 transition-colors min-w-0 truncate text-mapcream placeholder:text-mapcream"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </form>

            {/* City Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-1 min-w-0 truncate" style={{ backgroundColor: '#F7E1B5', color: 'black' }}>
                  <MapPin className="h-4 w-4 text-black" />
                  <span className="truncate max-w-[7rem] text-black">{selectedCity ?? internalCity}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 max-w-xs">
                {cities.map((city) => (
                  <DropdownMenuItem 
                    key={city.id}
                    onClick={() => (setSelectedCity ? setSelectedCity(city.name) : setInternalCity(city.name))}
                  >
                    <span className="truncate max-w-[8rem]">{city.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Premium & Membership Buttons */}
            <Button className="min-w-0 truncate text-mapcream bg-transparent hover:bg-transparent" onClick={() => navigate("/pricing")}>Premium</Button>
            <Button className="min-w-0 truncate text-mapcream bg-transparent hover:bg-transparent" onClick={() => navigate("/membership")}>Membership</Button>

            {/* Experiences Navigation */}
            <Button variant="ghost" asChild className="min-w-0 truncate text-mapcream">
              <Link to="/events" className="flex items-center text-mapcream">
                <Calendar className="h-4 w-4 mr-2 text-mapcream" />
                <span className="truncate text-mapcream">Experiences</span>
              </Link>
            </Button>

            <Button variant="ghost" asChild className="min-w-0 truncate text-mapcream">
              <Link to="/previousevents" className="flex items-center text-mapcream">
                <History className="h-4 w-4 mr-2 text-mapcream" />
                <span className="truncate text-mapcream">Past Experiences</span>
              </Link>
            </Button>

            {/* Auth Buttons */}
            {!isSignedIn ? (
              <>
                <Button variant="outline" onClick={() => navigate('/auth')} className="min-w-0 truncate">Sign In</Button>
                <Button onClick={() => navigate('/auth')} className="min-w-0 truncate">Sign Up</Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => handleAuthenticatedNavigation("/profile")}
                  className="flex items-center gap-2 min-w-0 truncate text-mapcream"
                >
                  <User className="h-4 w-4 text-mapcream" />
                  <span className="truncate text-mapcream">Profile</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleAuthenticatedNavigation("/profile?tab=bookings")}
                  className="flex items-center gap-2 min-w-0 truncate text-mapcream"
                >
                  <Ticket className="h-4 w-4 text-mapcream" />
                  <span className="truncate text-mapcream">My Bookings</span>
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="min-w-0 truncate text-mapcream"><LogOut className="h-4 w-4 mr-2 text-mapcream" /><span className="truncate text-mapcream">Sign Out</span></Button>
              </>
            )}
          </div>
          
          {/* Mobile Search and Menu */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Search Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Mobile Menu Trigger */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search and Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden p-4 shadow-md border-t" style={bgColor ? { backgroundColor: bgColor, backdropFilter: 'blur(8px)' } : {}}>
            <div className="flex flex-col space-y-4">
              {/* Mobile Search Bar */}
              <form className="relative" onSubmit={handleSearch}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search experiences, artists, venues..."
                  className="pl-10 bg-muted/30 border-none focus-visible:ring-violet hover:bg-muted/50 transition-colors"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                />
              </form>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-between w-full" style={{ backgroundColor: '#F7E1B5', color: 'black' }}>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-black" />
                      {selectedCity ?? internalCity}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-full">
                  {cities.map((city) => (
                    <DropdownMenuItem 
                      key={city.id}
                      onClick={() => (setSelectedCity ? setSelectedCity(city.name) : setInternalCity(city.name))}
                    >
                      {city.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Premium & Membership (Mobile) */}
              <Button className="bg-gradient-to-r from-violet to-red hover:opacity-90 transition-opacity w-full" onClick={() => navigate("/pricing")}>
                Premium
              </Button>
              <Button className="bg-gradient-to-r from-violet to-red hover:opacity-90 transition-opacity w-full" onClick={() => navigate("/membership")}>
                Membership
              </Button>
              
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/events">
                  <Calendar className="h-4 w-4 mr-2" />
                  Experiences
                </Link>
              </Button>

              <Button variant="ghost" className="w-full" asChild>
                <Link to="/previousevents">
                  <History className="h-4 w-4 mr-2" />
                  Past Experiences
                </Link>
              </Button>

              {!isSignedIn ? (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">Sign In</Button>
                  <Button onClick={() => navigate('/auth')} className="w-full">Sign Up</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => handleAuthenticatedNavigation("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => handleAuthenticatedNavigation("/profile?tab=bookings")}>
                    <Ticket className="h-4 w-4 mr-2" />
                    My Bookings
                  </Button>
                  <Button variant="ghost" className="w-full justify-center" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              )}
              
            </div>
          </div>
        )}
      </header>

      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm border-t border-border shadow-lg"
        style={{ backgroundColor: '#F7E1B5' }}
      >
        <div className="flex items-center justify-around py-2">
          {/* Home */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-full transition-all duration-200 relative ${
              location.pathname === "/" 
                ? "text-violet bg-yellow-300/30 shadow-md" 
                : "text-black"
            }`}
            onClick={() => navigate("/")}
          >
            <Home className="h-5 w-5 text-black" />
            <span className="text-xs">Home</span>
          </Button>

          {/* Experiences */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-full transition-all duration-200 relative ${
              location.pathname === "/events" 
                ? "text-violet bg-yellow-300/30 shadow-md" 
                : "text-black"
            }`}
            onClick={() => navigate("/events")}
          >
            <Calendar className="h-5 w-5 text-black" />
            <span className="text-xs">Experiences</span>
          </Button>

          {/* My Bookings */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-full transition-all duration-200 relative ${
              location.pathname === "/profile" && location.search.includes("tab=bookings")
                ? "text-violet bg-yellow-300/30 shadow-md" 
                : "text-black"
            }`}
            onClick={() => handleAuthenticatedNavigation("/profile?tab=bookings")}
          >
            <Ticket className="h-5 w-5 text-black" />
            <span className="text-xs">Bookings</span>
          </Button>

         
          {/* Membership (was Premium) */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-full transition-all duration-200 relative ${
              location.pathname === "/membership"
                ? "text-violet bg-yellow-300/30 shadow-md"
                : "text-black"
            }`}
            onClick={() => navigate("/membership")}
          >
            <Heart className="h-5 w-5 text-black" />
            <span className="text-xs">Membership</span>
          </Button>

           {/* Profile */}
           <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-full transition-all duration-200 relative ${
              location.pathname === "/profile" && !location.search.includes("tab=bookings")
                ? "text-violet bg-yellow-300/30 shadow-md" 
                : "text-black"
            }`}
            onClick={() => handleAuthenticatedNavigation("/profile")}
          >
            <User className="h-5 w-5 text-black" />
            <span className="text-xs">Profile</span>
          </Button>


        </div>
      </nav>

    </>
  );
};

export default Navbar;
