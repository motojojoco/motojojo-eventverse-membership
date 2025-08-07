import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollableNumberInput } from "@/components/ui/scrollable-number-input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Minus, Plus, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore, CartItem } from "@/store/cart-store";
import { createBookingFromCart } from "@/services/bookingService";
import BookingTicket from "@/components/tickets/BookingTicket";
import MovingPartyBackground from "@/components/ui/MovingPartyBackground";

const Cart = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Track individual ticket names for each cart item
  const [ticketNames, setTicketNames] = useState<{ [itemId: string]: string[] }>({});
  
  // Calculate total tickets across all items
  const totalTickets = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Initialize ticket names when items change
  useEffect(() => {
    const newTicketNames: { [itemId: string]: string[] } = {};
    items.forEach(item => {
      if (!ticketNames[item.id]) {
        newTicketNames[item.id] = Array(item.quantity).fill("");
      } else if (ticketNames[item.id].length !== item.quantity) {
        // Adjust array length if quantity changed
        if (item.quantity > ticketNames[item.id].length) {
          newTicketNames[item.id] = [...ticketNames[item.id], ...Array(item.quantity - ticketNames[item.id].length).fill("")];
        } else {
          newTicketNames[item.id] = ticketNames[item.id].slice(0, item.quantity);
        }
      } else {
        newTicketNames[item.id] = ticketNames[item.id];
      }
    });
    setTicketNames(newTicketNames);
  }, [items, ticketNames]);

  const validateTicketNames = () => {
    if (totalTickets <= 1) return true; // No validation needed for single ticket
    
    for (const item of items) {
      const itemTicketNames = ticketNames[item.id] || [];
      const emptyNames = itemTicketNames.slice(0, item.quantity).filter(name => !name.trim());
      if (emptyNames.length > 0) {
        return false;
      }
    }
    return true;
  };
  
  // Form validation
  const isFormValid = name && email && phone && items.length > 0 && validateTicketNames();
  
  const handleQuantityChange = (item: CartItem, newQty: number) => {
    if (newQty >= 1 && newQty <= 15) {
      updateQuantity(item.id, newQty);
    }
  };

  const handleTicketNameChange = (itemId: string, index: number, value: string) => {
    setTicketNames(prev => ({
      ...prev,
      [itemId]: prev[itemId].map((name, i) => i === index ? value : name)
    }));
  };
  
  const handleCheckout = async () => {
    if (!isSignedIn || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your booking.",
      });
      navigate("/");
      return;
    }
    
    if (!isFormValid) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields to proceed.",
        variant: "destructive"
      });
      return;
    }

    // Validate ticket names if multiple tickets
    if (!validateTicketNames()) {
      toast({
        title: "Missing Names",
        description: "Please provide names for all ticket holders.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Process each item in cart
      const createdBookings: any[] = [];
      for (const item of items) {
        const itemTicketNames = ticketNames[item.id] || [];
        console.log('Booking', item.eventTitle, 'ticketNames:', itemTicketNames);
        const booking = await createBookingFromCart(
          user.id,
          item.eventId,
          name,
          email,
          phone,
          item.quantity,
          item.price * item.quantity,
          itemTicketNames
        );
        
        if (!booking) {
          throw new Error(`Failed to create booking for ${item.eventTitle}`);
        }
        
        createdBookings.push(booking);
      }
      
      // Clear cart after successful checkout
      clearCart();
      
      // Show success message and redirect to ticket preview
      toast({
        title: "Booking Successful!",
        description: "Your tickets have been booked successfully and sent to your email.",
      });
      
      // Redirect to ticket preview for the first booking
      if (createdBookings.length > 0) {
        navigate(`/ticket-preview/${createdBookings[0].id}`);
      } else {
        navigate("/profile?tab=bookings");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  if (isLoaded && !isSignedIn) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to view your cart.",
    });
    navigate("/");
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <MovingPartyBackground />
      
      <main className="flex-grow pt-24 pb-20 md:pb-16">
        <div className="container-padding">
          <FadeIn>
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>
          </FadeIn>
          
          {items.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-medium mb-2">Your Cart is Empty</h3>
                <p className="text-muted-foreground mb-6">Browse our events and add tickets to your cart.</p>
                <Button onClick={() => navigate("/")}>
                  Explore Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="md:col-span-2">
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="md:flex">
                        <div className="md:w-1/4 h-40 md:h-auto">
                          <img 
                            src={item.eventImage} 
                            alt={item.eventTitle} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 md:p-6 md:w-3/4 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{item.eventTitle}</h3>
                            <p className="text-muted-foreground text-sm mb-2">
                              {item.venue}, {item.city} • {new Date(item.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <ScrollableNumberInput
                                value={item.quantity}
                                onChange={(newQty) => handleQuantityChange(item, newQty)}
                                min={1}
                                max={15}
                                showArrows={false}
                                showScrollHint={false}
                                className="w-16"
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                disabled={item.quantity >= 15}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Checkout Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Checkout</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>

                      {/* Individual ticket holder names */}
                      {totalTickets > 1 && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Ticket Holder Names</Label>
                            <div className="text-xs text-muted-foreground mt-1">
                              Please provide the name for each person attending
                            </div>
                          </div>
                          
                          {items.map((item) => (
                            <div key={item.id} className="space-y-3">
                              <div className="text-sm font-medium text-muted-foreground">
                                {item.eventTitle} ({item.quantity} ticket{item.quantity !== 1 ? 's' : ''})
                              </div>
                              {Array.from({ length: item.quantity }, (_, index) => (
                                <div key={`${item.id}-${index}`}>
                                  <Label htmlFor={`ticket-name-${item.id}-${index}`} className="text-sm">
                                    Ticket {index + 1} - Attendee Name
                                  </Label>
                                  <Input
                                    id={`ticket-name-${item.id}-${index}`}
                                    value={ticketNames[item.id]?.[index] || ""}
                                    onChange={(e) => handleTicketNameChange(item.id, index, e.target.value)}
                                    placeholder={`Enter name for ticket ${index + 1}`}
                                    required
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </form>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(getTotalPrice())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Booking Fee</span>
                        <span>₹0</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span>{formatCurrency(getTotalPrice())}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full flex items-center gap-2" 
                      onClick={handleCheckout}
                      disabled={!isFormValid || isProcessing}
                    >
                      {isProcessing ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <Ticket className="h-4 w-4" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart;
