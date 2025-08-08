import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScrollableNumberInput } from "@/components/ui/scrollable-number-input";
import BookingTicket from "@/components/tickets/BookingTicket";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getEvent } from "@/services/eventService";

interface RazorpayButtonProps {
  eventId: string; // Changed to string only since we're using UUIDs
  eventName: string;
  amount: number;
  onSuccess?: () => void;
  className?: string; // Added className prop to the interface
}

// Load Razorpay script
const loadRazorpayScript = (callback: () => void) => {
  if (typeof window !== 'undefined' && (window as any).Razorpay) {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = callback;
  document.head.appendChild(script);
};

const RazorpayButton = ({ eventId, eventName, amount, onSuccess, className }: RazorpayButtonProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tickets: 1
  });
  const [ticketNames, setTicketNames] = useState<string[]>([""]);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId
  });

  // Subscribe to real-time booking updates
  useEffect(() => {
    const channel = supabase
      .channel('bookings-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('New booking:', payload);
          // Refresh event details if needed
          if (onSuccess) onSuccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, onSuccess]);

  // Check for pending booking after sign-in
  useEffect(() => {
    if (isSignedIn) {
      const pendingBooking = localStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          // Check if this is the same event and booking is recent (within 1 hour)
          const isRecent = Date.now() - booking.timestamp < 60 * 60 * 1000; // 1 hour
          const isSameEvent = booking.eventId === eventId;
          
          if (isRecent && isSameEvent) {
            // Clear the pending booking
            localStorage.removeItem('pendingBooking');
            
            // Show a toast and open the booking form
            toast({
              title: "Welcome back!",
              description: "Let's continue with your booking.",
            });
            
            // Small delay to ensure the toast is visible
            setTimeout(() => {
              setIsFormOpen(true);
            }, 1000);
          } else if (isRecent && !isSameEvent) {
            // User is on a different event page, redirect them to the correct event
            toast({
              title: "Redirecting to your event",
              description: "Taking you back to continue your booking.",
            });
            
            setTimeout(() => {
              navigate(`/event/${booking.eventId}`);
            }, 1500);
          } else if (!isRecent) {
            // Clear old pending booking
            localStorage.removeItem('pendingBooking');
            toast({
              title: "Booking expired",
              description: "Your pending booking has expired. Please try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error parsing pending booking:', error);
          localStorage.removeItem('pendingBooking');
        }
      }
    }
  }, [isSignedIn, eventId, toast, navigate]);

  // Update ticket names when ticket count changes
  useEffect(() => {
    if (formData.tickets > ticketNames.length) {
      // Add more name fields
      setTicketNames(prev => [...prev, ...Array(formData.tickets - prev.length).fill("")]);
    } else if (formData.tickets < ticketNames.length) {
      // Remove extra name fields
      setTicketNames(prev => prev.slice(0, formData.tickets));
    }
  }, [formData.tickets, ticketNames.length]);

  const upsertUserIfNeeded = async (formData: any) => {
    if (!user?.id) return;
    const { data: existing, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const newUserProfile = {
      id: user.id,
      email: formData.email,
      full_name: formData.name,
      phone: formData.phone,
      created_at: new Date().toISOString()
    };

    if (!existing) {
      // Insert user if doesn't exist
      await supabase.from('users').insert(newUserProfile);
    } else {
      // Update only if changed
      if (
        existing.email !== formData.email ||
        existing.full_name !== formData.name ||
        existing.phone !== formData.phone
      ) {
        await supabase.from('users').update({
          email: formData.email,
          full_name: formData.name,
          phone: formData.phone,
        }).eq('id', user.id);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'tickets') {
        const ticketCount = parseInt(value) || 1;
        return { ...prev, [name]: Math.max(1, Math.min(15, ticketCount)) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleTicketCountChange = (value: number) => {
    setFormData(prev => ({ ...prev, tickets: value }));
  };

  const handleTicketNameChange = (index: number, value: string) => {
    setTicketNames(prev => {
      const newNames = [...prev];
      newNames[index] = value;
      return newNames;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to book tickets.",
        variant: "destructive"
      });
      setIsFormOpen(false);
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all the required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate ticket names if multiple tickets
    if (formData.tickets > 1) {
      const emptyNames = ticketNames.slice(0, formData.tickets).filter(name => !name.trim());
      if (emptyNames.length > 0) {
        toast({
          title: "Missing Names",
          description: "Please provide names for all ticket holders.",
          variant: "destructive"
        });
        return;
      }
    }

    await upsertUserIfNeeded(formData);

    loadRazorpayScript(() => {
      const totalAmount = amount * formData.tickets;

      const options = {
        //key: "rzp_live_yAyC4YmewB4VQG", // Live key for production
        key: "rzp_test_AIaN0EfXmfZgMk", // Demo/Test key for testing
        amount: totalAmount * 100,
        currency: "INR",
        name: "Motojojo",
        description: `${formData.tickets} Ticket(s) for ${eventName}`,
        image: "/motojojo-logo.png", // Updated to use new logo
        handler: async function(response: any) {
          console.log('Razorpay payment successful:', response);
          try {
            // Save booking to Supabase
            const { data: booking, error: bookingError } = await supabase
              .from('bookings')
              .insert({
                user_id: user?.id,
                event_id: eventId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                tickets: formData.tickets,
                amount: totalAmount,
                status: 'confirmed',
                payment_id: response.razorpay_payment_id, // Use correct column
                // razorpay_payment_id: response.razorpay_payment_id, // Old, does not exist
                order_id: response.razorpay_order_id || null,
                booking_date: new Date().toISOString(),
                ticket_names: formData.tickets > 1 ? ticketNames : [formData.name],
              })
              .select('id')
              .single();

            if (bookingError) {
              console.error("Error saving booking:", bookingError);
              toast({
                title: "Booking Error",
                description: "There was an error saving your booking. Please contact support.",
                variant: "destructive"
              });
              return;
            }
            
            console.log('Booking saved successfully:', booking);

            // Store the booking ID for the success dialog
            setLastBookingId(booking.id);

            // Generate tickets for the booking
            const ticketNumbers: string[] = [];
            const qrCodes: string[] = [];

            for (let i = 0; i < formData.tickets; i++) {
              const ticketNumber = `MJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNumber}`;
              
              // Use individual name if multiple tickets, otherwise use main name
              const ticketHolderName = formData.tickets > 1 ? ticketNames[i] : formData.name;
              
              console.log('Creating ticket with booking_id:', booking.id);
              const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .insert({
                  booking_id: booking.id,
                  ticket_number: ticketNumber,
                  username: ticketHolderName,
                });

              if (ticketError) {
                console.error("Error creating ticket:", ticketError);
                console.error("Ticket data that failed:", {
                  booking_id: booking.id,
                  ticket_number: ticketNumber,
                  qr_code: qrCode,
                  username: ticketHolderName,
                });
                continue;
              }

              // If no error, assume ticket was created successfully
              ticketNumbers.push(ticketNumber);
              qrCodes.push(qrCode);
            }

            // After creating tickets, send email and WhatsApp message
            const { data: eventData } = await supabase
              .from('events')
              .select('*')
              .eq('id', eventId)
              .single();

            if (eventData) {
              // Send email with tickets
              console.log('Attempting to send email to:', formData.email);
              try {
                const emailResponse = await supabase.functions.invoke('send-ticket', {
                  body: {
                    email: formData.email,
                    name: formData.name,
                    eventTitle: eventData.title,
                    eventDate: eventData.date,
                    eventTime: eventData.time,
                    eventVenue: `${eventData.venue}, ${eventData.city}`,
                    ticketNumbers,
                    qrCodes,
                    ticketHolderNames: formData.tickets > 1 ? ticketNames : undefined
                  }
                });
                console.log('Email function response:', emailResponse);
              } catch (emailError) {
                console.error('Error sending email via Supabase function:', emailError);
                
                // Fallback: Try sending email via local email service
                try {
                  console.log('Attempting fallback email via local service...');
                  const fallbackResponse = await fetch('http://localhost:3001/send-ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: formData.email,
                      name: formData.name,
                      eventTitle: eventData.title,
                      eventDate: eventData.date,
                      eventTime: eventData.time,
                      eventVenue: `${eventData.venue}, ${eventData.city}`,
                      ticketNumbers,
                      qrCodes,
                      ticketHolderNames: formData.tickets > 1 ? ticketNames : undefined
                    })
                  });
                  
                  if (fallbackResponse.ok) {
                    const fallbackResult = await fallbackResponse.json();
                    console.log('Fallback email sent successfully:', fallbackResult);
                  } else {
                    console.error('Fallback email failed:', await fallbackResponse.text());
                  }
                } catch (fallbackError) {
                  console.error('Fallback email service also failed:', fallbackError);
                }
              }

              // Send WhatsApp message with ticket details
              try {
                await supabase.functions.invoke('send-whatsapp', {
                  body: {
                    to: formData.phone,
                    eventTitle: eventName,
                    ticketCount: formData.tickets,
                    date: eventData.date,
                    time: eventData.time,
                    venue: `${eventData.venue}, ${eventData.city}`
                  }
                });
              } catch (whatsappError) {
                console.error('Error sending WhatsApp message:', whatsappError);
                // Don't throw error here as booking was successful
              }
            }

            setIsFormOpen(false);
            setIsSuccessOpen(true);
            if (onSuccess) onSuccess();
          } catch (err) {
            console.error("Error processing payment:", err);
            toast({
              title: "Payment Error",
              description: "There was an error processing your payment. Please try again.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#6A0DAD"
        }
      };

      setIsFormOpen(false); // Close the dialog before opening Razorpay
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    });
  };

  const handleButtonClick = () => {
    if (!isSignedIn) {
      // Redirect to sign-in page with redirect param set to current page
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setIsFormOpen(true);
  };
  
  return (
    <>
      <Button 
        className={cn(
          "bg-raspberry text-black font-bold px-6 py-3 rounded-lg shadow-md hover:bg-raspberry/80 transition-colors",
          className
        )}
        onClick={handleButtonClick}
      >
        Book Now
      </Button>
      
      {/* Booking Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              Please provide your details to book tickets for {eventName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Price Breakdown Section */}
              {event && (
                <div className="mb-2">
                  <div className="text-xl font-bold mb-1">Price Breakdown</div>
                  <div className="text-base">Base Price: <span className="font-semibold">₹{event.base_price?.toLocaleString() ?? 0}</span></div>
                  <div className="text-base">GST: <span className="font-semibold">₹{event.gst?.toLocaleString() ?? 0}</span></div>
                  <div className="text-base">Convenience Fee: <span className="font-semibold">₹{event.convenience_fee?.toLocaleString() ?? 0}</span></div>
                  <div className="text-base">Subtotal: <span className="font-semibold">₹{event.subtotal?.toLocaleString() ?? 0}</span></div>
                  <div className="text-lg font-bold mt-2">Ticket Price: <span className="text-yellow">₹{event.ticket_price?.toLocaleString() ?? 0}</span></div>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="bg-gray-100/60 text-black placeholder:text-gray-500 focus:bg-gray-200/80"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                  className="bg-gray-100/60 text-black placeholder:text-gray-500 focus:bg-gray-200/80"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">WhatsApp Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your WhatsApp number"
                  required
                  className="bg-gray-100/60 text-black placeholder:text-gray-500 focus:bg-gray-200/80"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tickets">Number of Tickets</Label>
                <ScrollableNumberInput
                  value={formData.tickets}
                  onChange={handleTicketCountChange}
                  min={1}
                  max={15}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Individual ticket holder names */}
              {formData.tickets > 1 && (
                <div className="grid gap-3">
                  <Label className="text-sm font-medium">Ticket Holder Names</Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Please provide the name for each person attending
                  </div>
                  {ticketNames.slice(0, formData.tickets).map((name, index) => (
                    <div key={index} className="grid gap-2">
                      <Label htmlFor={`ticket-name-${index}`} className="text-sm">
                        Ticket {index + 1} - Attendee Name
                      </Label>
                      <Input
                        id={`ticket-name-${index}`}
                        value={name}
                        onChange={(e) => handleTicketNameChange(index, e.target.value)}
                        placeholder={`Enter name for ticket ${index + 1}`}
                        required
                        className="bg-gray-100/60 text-black placeholder:text-gray-500 focus:bg-gray-200/80"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2 text-right font-semibold">
                <div>Price: ₹{amount.toLocaleString()} x {formData.tickets}</div>
                <div className="text-lg">Total: ₹{(amount * formData.tickets).toLocaleString()}</div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Ticket
              </Button>
              <Button type="submit" className="bg-sandstorm text-black">Proceed to Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-green-500">Booking Confirmed!</DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg mb-2">Your tickets are booked!</p>
          
            <p className="text-muted-foreground mb-4">You will receive an email with a link to join our WhatsApp channel for event updates and venue details.</p>
            <p className="text-muted-foreground mb-4">(You will receive an email 12 hours prior before the experience.)</p>
            <p className="text-sm text-muted-foreground">Can't wait to see you there!</p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="w-full"
              onClick={() => {
                setIsSuccessOpen(false);
                navigate(`/ticket-preview/${lastBookingId}`);
              }}
            >
              View Ticket Preview
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSuccessOpen(false);
                navigate("/profile");
              }}
            >
              View My Bookings
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setIsSuccessOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Preview</DialogTitle>
            <DialogDescription>
              Preview how your ticket will look before booking
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <BookingTicket
              eventName={eventName}
              eventDescription={event?.subtitle || event?.description || "Event description will be loaded from the event details"}
              eventDate={event?.date || ""}
              eventTime={event?.time || ""}
              eventVenue={event?.venue || "Event Venue"}
              eventCity={event?.city || "Event City"}
              eventPrice={amount}
              bookerName={formData.name}
              bookerEmail={formData.email}
              bookerPhone={formData.phone}
              numberOfTickets={formData.tickets}
              totalAmount={amount * formData.tickets}
              isBooking={false}
              ticketHolderNames={ticketNames}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewOpen(false)}
            >
              Back to Form
            </Button>
            <Button 
              onClick={() => {
                setIsPreviewOpen(false);
                // Trigger form submission
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RazorpayButton;
