import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EventForm from "@/components/admin/EventForm";
import CategoryForm from "@/components/admin/CategoryForm";
import EventTypeForm from "@/components/admin/EventTypeForm";
import BannerForm from "@/components/admin/BannerForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/services/eventService";
import { createEvent, updateEvent, deleteEvent, subscribeToEvents } from "@/services/adminEventService";
import { getEvents } from "@/services/eventService";
import { EventType, getAllEventTypes, createEventType, updateEventType, deleteEventType } from "@/services/eventTypeService";
import { Banner, getAllBanners, createBanner, updateBanner, deleteBanner } from "@/services/bannerService";
import { Testimonial, getAllTestimonials, getPendingTestimonials, approveTestimonial, rejectTestimonial, updateTestimonial, deleteTestimonial } from "@/services/testimonialService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, Filter, Users, Calendar, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw, Download, MoreHorizontal, MessageSquare, Star, Check, X } from "lucide-react";
import { experiences } from "@/data/mockData";
import ArtistForm from "@/components/admin/ArtistForm";
import { processCompletedEvents, getUserBookings, Booking, getAllBookings, checkAttendanceFields } from "@/services/bookingService";
import { 
  createHostInvitation, 
  getHostInvitations, 
  deleteHostInvitation,
  assignHostToEvent,
  removeHostFromEvent,
  getHostProfile
} from "@/services/hostService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { getAllEvents } from "@/services/eventService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEventTypeEditDialogOpen, setIsEventTypeEditDialogOpen] = useState(false);
  const [isBannerEditDialogOpen, setIsBannerEditDialogOpen] = useState(false);
  const [isTestimonialEditDialogOpen, setIsTestimonialEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessingEvents, setIsProcessingEvents] = useState(false);
  const [currentTab, setCurrentTab] = useState('events');
  const itemsPerPage = 50;
  const { inviteUser } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [hostInviteEmail, setHostInviteEmail] = useState("");
  const [hostInviteLoading, setHostInviteLoading] = useState(false);
  const [isHostInviteDialogOpen, setIsHostInviteDialogOpen] = useState(false);
  const [hostActivity, setHostActivity] = useState([]);

  // Fetch events using React Query with proper query function
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      return await getEvents();
    }
  });

  // Fetch all bookings using React Query
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: getAllBookings
  });

  // Fetch all event types using React Query
  const { data: eventTypes = [], isLoading: eventTypesLoading } = useQuery({
    queryKey: ['admin-event-types'],
    queryFn: getAllEventTypes
  });

  // Fetch all banners using React Query
  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: getAllBanners
  });

  // Fetch all testimonials using React Query
  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: getAllTestimonials
  });

  // Fetch pending testimonials using React Query
  const { data: pendingTestimonials = [], isLoading: pendingTestimonialsLoading } = useQuery({
    queryKey: ['admin-pending-testimonials'],
    queryFn: getPendingTestimonials
  });

  // Fetch host invitations using React Query
  const { data: hostInvitations = [], isLoading: hostInvitationsLoading } = useQuery({
    queryKey: ['admin-host-invitations'],
    queryFn: getHostInvitations
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToEvents((event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Event Updated",
        description: "The events list has been updated.",
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, toast]);

  // Subscribe to real-time booking updates
  useEffect(() => {
    const subscription = supabase
      .channel('admin-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        (payload) => {
          console.log('Booking change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
          toast({
            title: "Booking Updated",
            description: "The bookings list has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  const handleCreateEvent = async (data: Omit<Event, "id" | "created_at" | "updated_at">) => {
    await createEvent(data);
    queryClient.invalidateQueries({ queryKey: ['events'] });
    toast({
      title: "Success",
      description: "Event created successfully",
    });
  };

  const handleUpdateEvent = async (data: Omit<Event, "id" | "created_at" | "updated_at">) => {
    if (!selectedEvent?.id) return;
    await updateEvent(selectedEvent.id, data);
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
    queryClient.invalidateQueries({ queryKey: ['events'] });
    toast({
      title: "Success",
      description: "Event updated successfully",
    });
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(id);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    }
  };

  // Event Type handlers
  const handleCreateEventType = async (data: any) => {
    await createEventType(data);
    queryClient.invalidateQueries({ queryKey: ['admin-event-types'] });
    queryClient.invalidateQueries({ queryKey: ['event-types'] });
    toast({
      title: "Success",
      description: "Event type created successfully",
    });
  };

  const handleUpdateEventType = async (data: any) => {
    if (!selectedEventType?.id) return;
    await updateEventType(selectedEventType.id, data);
    setIsEventTypeEditDialogOpen(false);
    setSelectedEventType(null);
    queryClient.invalidateQueries({ queryKey: ['admin-event-types'] });
    queryClient.invalidateQueries({ queryKey: ['event-types'] });
    toast({
      title: "Success",
      description: "Event type updated successfully",
    });
  };

  const handleDeleteEventType = async (id: string) => {
    if (confirm("Are you sure you want to delete this event type?")) {
      await deleteEventType(id);
      queryClient.invalidateQueries({ queryKey: ['admin-event-types'] });
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
      toast({
        title: "Success",
        description: "Event type deleted successfully",
      });
    }
  };

  // Banner handlers
  const handleCreateBanner = async (data: any) => {
    await createBanner(data);
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
    toast({
      title: "Success",
      description: "Banner created successfully",
    });
  };

  const handleUpdateBanner = async (data: any) => {
    if (!selectedBanner?.id) return;
    await updateBanner(selectedBanner.id, data);
    setIsBannerEditDialogOpen(false);
    setSelectedBanner(null);
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
    toast({
      title: "Success",
      description: "Banner updated successfully",
    });
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      await deleteBanner(id);
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });
    }
  };

  // Testimonial handlers
  const handleApproveTestimonial = async (id: string) => {
    try {
      await approveTestimonial(id);
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({
        title: "Success",
        description: "Testimonial approved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve testimonial",
        variant: "destructive",
      });
    }
  };

  const handleRejectTestimonial = async (id: string) => {
    if (confirm("Are you sure you want to reject this testimonial?")) {
      try {
        await rejectTestimonial(id);
        queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
        queryClient.invalidateQueries({ queryKey: ['admin-pending-testimonials'] });
        queryClient.invalidateQueries({ queryKey: ['testimonials'] });
        toast({
          title: "Success",
          description: "Testimonial rejected successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to reject testimonial",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateTestimonial = async (data: any) => {
    if (!selectedTestimonial?.id) return;
    try {
      await updateTestimonial(selectedTestimonial.id, data);
      setIsTestimonialEditDialogOpen(false);
      setSelectedTestimonial(null);
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({
        title: "Success",
        description: "Testimonial updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update testimonial",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      try {
        await deleteTestimonial(id);
        queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
        queryClient.invalidateQueries({ queryKey: ['testimonials'] });
        toast({
          title: "Success",
          description: "Testimonial deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete testimonial",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get current items for pagination
  const getCurrentItems = (items: any[]) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Filter bookings based on search term and status
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.event?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Auth check
  useEffect(() => {
    // In a real app, you would check if the user is authenticated
    // For demo purposes, we'll just assume they are
    console.log("Admin authenticated");
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/admin");
  };
  
  // Calculate total pages
  const totalPages = (items: any[]) => Math.ceil(items.length / itemsPerPage);
  
  // Handle form submissions (mock implementations)
  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Experience Added",
      description: "The new experience has been successfully added.",
    });
  };
  
  const handleProcessCompletedEvents = async () => {
    if (isProcessingEvents) return; // Prevent multiple clicks
    
    setIsProcessingEvents(true);
    try {
      toast({
        title: "Processing Events",
        description: "Marking tickets as attended for completed events...",
      });

      console.log('Starting process completed events...');
      const result = await processCompletedEvents();
      console.log('Process completed events result:', result);
      
      if (result.success) {
        toast({
          title: "Events Processed Successfully",
          description: `Successfully marked ${result.totalTicketsUpdated} tickets as attended for completed events.`,
        });
        // Refetch data to update statistics
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      } else {
        toast({
          title: "Processing Failed",
          description: "Failed to process completed events. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error processing completed events:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing completed events. Please check the console for details.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingEvents(false);
    }
  };

  // Test function to check if there are any completed events
  const handleTestCompletedEvents = async () => {
    try {
      // Check if attendance fields exist
      const attendanceFieldsExist = await checkAttendanceFields();
      console.log('Attendance fields exist:', attendanceFieldsExist);
      
      const now = new Date();
      const completedEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now;
      });
      
      console.log('Current time:', now);
      console.log('Completed events found:', completedEvents);
      
      toast({
        title: "Test Results",
        description: `Found ${completedEvents.length} completed events. Attendance fields: ${attendanceFieldsExist ? 'OK' : 'Missing'}. Check console for details.`,
      });
    } catch (error) {
      console.error("Error testing completed events:", error);
    }
  };

  // Handle generating system report
  const handleGenerateSystemReport = async () => {
    try {
      toast({
        title: "Generating Report",
        description: "Creating comprehensive system report...",
      });

      // Calculate various statistics
      const totalEvents = events?.length || 0;
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
      
      // Calculate completed events
      const now = new Date();
      const completedEvents = events?.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now;
      }) || [];
      
      // Calculate upcoming events
      const upcomingEvents = events?.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > now;
      }) || [];
      
      // Calculate booking statistics
      const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
      const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
      
      // Calculate average booking value
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      // Generate report content
      const report = {
        generatedAt: new Date().toLocaleString(),
        summary: {
          totalEvents,
          totalBookings,
          totalRevenue: totalRevenue.toLocaleString(),
          completedEvents: completedEvents.length,
          upcomingEvents: upcomingEvents.length,
          confirmedBookings,
          pendingBookings,
          averageBookingValue: averageBookingValue.toLocaleString()
        },
        topEvents: events?.slice(0, 5).map(event => ({
          title: event.title,
          date: event.date,
          price: event.price
        })) || [],
        recentBookings: bookings.slice(0, 5).map(booking => ({
          event: booking.event?.title || 'Unknown Event',
          customer: booking.name,
          amount: booking.amount,
          date: booking.booking_date
        }))
      };
      
      // Log the report to console (in a real app, this would be exported or sent to admin)
      console.log('=== SYSTEM REPORT ===');
      console.log('Generated at:', report.generatedAt);
      console.log('Summary:', report.summary);
      console.log('Top Events:', report.topEvents);
      console.log('Recent Bookings:', report.recentBookings);
      console.log('=====================');
      
      // Show success message with key metrics
      toast({
        title: "Report Generated",
        description: `Total: ${totalEvents} events, ${totalBookings} bookings, ₹${totalRevenue.toLocaleString()} revenue. Check console for full report.`,
      });
      
    } catch (error) {
      console.error("Error generating system report:", error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate system report. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle downloading system report
  const handleDownloadSystemReport = async () => {
    try {
      toast({
        title: "Preparing Download",
        description: "Generating system report for download...",
      });

      // Calculate various statistics
      const totalEvents = events?.length || 0;
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
      
      // Calculate completed events
      const now = new Date();
      const completedEvents = events?.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now;
      }) || [];
      
      // Calculate upcoming events
      const upcomingEvents = events?.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > now;
      }) || [];
      
      // Calculate booking statistics
      const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
      const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
      
      // Calculate average booking value
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      // Generate CSV content
      const csvContent = [];
      
      // 1. Summary Report
      csvContent.push('=== SYSTEM SUMMARY REPORT ===');
      csvContent.push('Generated At,' + new Date().toLocaleString());
      csvContent.push('Report Type,Motojojo Event Management System Report');
      csvContent.push('');
      csvContent.push('Metric,Value');
      csvContent.push('Total Events,' + totalEvents);
      csvContent.push('Total Bookings,' + totalBookings);
      csvContent.push('Total Revenue (₹),' + totalRevenue.toLocaleString());
      csvContent.push('Completed Events,' + completedEvents.length);
      csvContent.push('Upcoming Events,' + upcomingEvents.length);
      csvContent.push('Confirmed Bookings,' + confirmedBookings);
      csvContent.push('Pending Bookings,' + pendingBookings);
      csvContent.push('Average Booking Value (₹),' + averageBookingValue.toLocaleString());
      csvContent.push('');
      
      // 2. All Events Report
      csvContent.push('=== ALL EVENTS ===');
      csvContent.push('Event ID,Title,Category,Date,Time,Venue,City,Price (₹),Status');
      events?.forEach(event => {
        const status = new Date(event.date) < now ? 'Completed' : 'Upcoming';
        csvContent.push([
          event.id,
          `"${event.title}"`,
          event.category,
          event.date,
          event.time || 'TBD',
          `"${event.venue}"`,
          event.city,
          event.price,
          status
        ].join(','));
      });
      csvContent.push('');
      
      // 3. All Bookings Report
      csvContent.push('=== ALL BOOKINGS ===');
      csvContent.push('Booking ID,Event,Customer Name,Email,Phone,Tickets,Amount (₹),Status,Booking Date');
      bookings.forEach(booking => {
        csvContent.push([
          booking.id,
          `"${booking.event?.title || 'Unknown Event'}"`,
          `"${booking.name}"`,
          booking.email,
          booking.phone,
          booking.tickets,
          booking.amount,
          booking.status,
          booking.booking_date
        ].join(','));
      });
      csvContent.push('');
      
      // 4. Revenue Analysis
      csvContent.push('=== REVENUE ANALYSIS ===');
      csvContent.push('Month,Revenue (₹)');
      const monthlyRevenue = bookings.reduce((acc, booking) => {
        const month = new Date(booking.booking_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        acc[month] = (acc[month] || 0) + booking.amount;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
        csvContent.push(`"${month}",${revenue.toLocaleString()}`);
      });
      csvContent.push('');
      
      // 5. Event Categories Analysis
      csvContent.push('=== EVENT CATEGORIES ===');
      csvContent.push('Category,Count');
      const eventCategories = events?.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      Object.entries(eventCategories).forEach(([category, count]) => {
        csvContent.push(`"${category}",${count}`);
      });
      csvContent.push('');
      
      // 6. Top Customers
      csvContent.push('=== TOP CUSTOMERS ===');
      csvContent.push('Customer Name,Total Spent (₹),Number of Bookings');
      const customerSpending = bookings.reduce((acc, booking) => {
        acc[booking.name] = acc[booking.name] || { total: 0, bookings: 0 };
        acc[booking.name].total += booking.amount;
        acc[booking.name].bookings += 1;
        return acc;
      }, {} as Record<string, { total: number; bookings: number }>);
      
      Object.entries(customerSpending)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)
        .forEach(([customer, data]) => {
          csvContent.push(`"${customer}",${data.total.toLocaleString()},${data.bookings}`);
        });
      csvContent.push('');
      
      // 7. Recent Activity
      csvContent.push('=== RECENT ACTIVITY (Last 10 Bookings) ===');
      csvContent.push('Event,Customer,Amount (₹),Date,Status');
      bookings.slice(0, 10).forEach(booking => {
        csvContent.push([
          `"${booking.event?.title || 'Unknown Event'}"`,
          `"${booking.name}"`,
          booking.amount,
          booking.booking_date,
          booking.status
        ].join(','));
      });
      
      // Create and download the CSV file
      const csvBlob = new Blob([csvContent.join('\n')], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `motojojo-system-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "System report has been downloaded as CSV file.",
      });
      
    } catch (error) {
      console.error("Error downloading system report:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download system report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInviteAdmin = async () => {
    setInviteLoading(true);
    try {
      const { error } = await inviteUser(inviteEmail, "admin");
      if (error) {
        toast({
          title: "Invite Failed",
          description: error.message || "Could not send invite.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Admin Invited",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setIsInviteDialogOpen(false);
        setInviteEmail("");
      }
    } catch (err: any) {
      toast({
        title: "Invite Failed",
        description: err.message || "Could not send invite.",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteHost = async () => {
    if (!hostInviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setHostInviteLoading(true);
    try {
      const result = await createHostInvitation(hostInviteEmail);
      if (result.success) {
        toast({
          title: "Success",
          description: "Host invitation sent successfully!",
        });
        setHostInviteEmail("");
        setIsHostInviteDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-host-invitations'] });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setHostInviteLoading(false);
    }
  };

  const handleDeleteHostInvitation = async (invitationId: string) => {
    if (confirm("Are you sure you want to delete this host invitation?")) {
      const success = await deleteHostInvitation(invitationId);
      if (success) {
        toast({
          title: "Success",
          description: "Host invitation deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['admin-host-invitations'] });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete host invitation",
          variant: "destructive"
        });
      }
    }
  };

  useEffect(() => {
    async function fetchHostActivity() {
      // Get all events with host info
      const events = await getAllEvents();
      // Get all hosts
      const { data: hosts } = await supabase.from('hosts').select('*');
      // Get all bookings
      const { data: bookings } = await supabase.from('bookings').select('*');
      // Get all tickets
      const { data: tickets } = await supabase.from('tickets').select('*');
      // Aggregate
      const activity = events.filter(e => e.host).map(event => {
        const host = hosts?.find(h => h.id === event.host);
        const eventBookings = bookings?.filter(b => b.event_id === event.id) || [];
        const eventTickets = tickets?.filter(t => eventBookings.map(b => b.id).includes(t.booking_id)) || [];
        const ticketsSold = eventTickets.length;
        const attendees = 0;
        const revenue = eventBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        return {
          hostName: host?.host_name || 'Unknown',
          eventTitle: event.title,
          eventDate: event.date,
          ticketsSold,
          attendees,
          revenue,
        };
      });
      setHostActivity(activity);
    }
    fetchHostActivity();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm shadow-sm py-4">
        <div className="container-padding flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gradient">Motojojo Admin</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Overview Stats */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{events?.length || 0} Events</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-green-500" />
                <span className="font-medium">{bookings.length} Bookings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">₹{bookings.reduce((sum, booking) => sum + booking.amount, 0).toLocaleString()}</span>
              </div>
            </div>
            
            {/* Mobile Stats */}
            <TooltipProvider>
              <div className="lg:hidden flex items-center gap-3 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{events?.length || 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total Events</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{bookings.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total Bookings</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">₹{(bookings.reduce((sum, booking) => sum + booking.amount, 0) / 1000).toFixed(0)}K</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total Revenue: ₹{bookings.reduce((sum, booking) => sum + booking.amount, 0).toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            
            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentTab('bookings')}
              >
                <Users className="h-4 w-4 mr-2" />
                View Bookings
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleProcessCompletedEvents}
                disabled={isProcessingEvents}
              >
                {isProcessingEvents ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadSystemReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={() => setIsInviteDialogOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Admin
              </Button>
            </div>
            
            {/* Mobile Quick Actions */}
            <div className="md:hidden flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setSelectedEvent(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Event
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setCurrentTab('bookings')}>
                    <Users className="h-4 w-4 mr-2" />
                    View All Bookings
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setCurrentTab('overview')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Dashboard Overview
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Reports & Analytics</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleGenerateSystemReport}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Generate Report
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleDownloadSystemReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Report
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Event Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleProcessCompletedEvents} disabled={isProcessingEvents}>
                    {isProcessingEvents ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {isProcessingEvents ? 'Processing Events...' : 'Process Completed Events'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleTestCompletedEvents}>
                    <Clock className="h-4 w-4 mr-2" />
                    Test Event Status
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            <Link to="/response">
              <Button className="bg-yellow text-black font-bold px-6 py-2 rounded-lg shadow-md hover:bg-yellow-400 transition-colors">
                Responses
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/admin/users")}
            >
              <Users className="h-4 w-4 mr-2" />
              View Users
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow py-8 pb-20 md:pb-8">
        <div className="container-padding">
          <FadeIn>
            <h2 className="text-3xl font-bold mb-8">Admin Dashboard</h2>
          </FadeIn>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid grid-cols-10 mb-8">
              <TabsTrigger value="events">Manage Events</TabsTrigger>
              <TabsTrigger value="event-types">Event Types</TabsTrigger>
             
              <TabsTrigger value="banners">Manage Banners</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="bookings">View Bookings</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="hosts">Host Management</TabsTrigger>
              <TabsTrigger value="host-activity">Host Activity</TabsTrigger>
           </TabsList>

          <TabsContent value="revenue">
            <FadeIn delay={100}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Revenue Breakdown</CardTitle>
                  <CardDescription className="text-black">
                    View revenue for current/ongoing events, previous/completed events, and overall totals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const now = new Date('2025-08-07T13:09:11+05:30');
                    // Group bookings by event and sum revenue
                    const groupByEventRevenue = (bookingsList) => {
                      const eventRevenueMap = new Map();
                      bookingsList.forEach(booking => {
                        const eventId = booking.event_id;
                        const eventTitle = booking.event?.title || 'Event not found';
                        if (!eventRevenueMap.has(eventId)) {
                          eventRevenueMap.set(eventId, { title: eventTitle, revenue: 0 });
                        }
                        eventRevenueMap.get(eventId).revenue += booking.amount;
                      });
                      return Array.from(eventRevenueMap.values())
                        .sort((a, b) => a.title.localeCompare(b.title));
                    };
                    // Split bookings by event status
                    const currentEventBookings = bookings.filter(
                      b => b.event?.date && new Date(b.event.date) >= now
                    );
                    const previousEventBookings = bookings.filter(
                      b => b.event?.date && new Date(b.event.date) < now
                    );
                    const groupedCurrent = groupByEventRevenue(currentEventBookings);
                    const groupedPrevious = groupByEventRevenue(previousEventBookings);
                    const totalCurrentRevenue = groupedCurrent.reduce((sum, e) => sum + e.revenue, 0);
                    const totalPreviousRevenue = groupedPrevious.reduce((sum, e) => sum + e.revenue, 0);
                    const totalRevenue = totalCurrentRevenue + totalPreviousRevenue;
                    return (
                      <div className="space-y-10">
                        {/* Current/Ongoing Events Revenue */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-black">Current/Ongoing Events Revenue</h3>
                          <div className="overflow-x-auto">
                            <Table className="text-black min-w-[320px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-black">Event</TableHead>
                                  <TableHead className="text-black">Revenue (₹)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {groupedCurrent.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                      No revenue for current/ongoing events.
                                    </TableCell>
                                  </TableRow>
                                ) : groupedCurrent.map(({ title, revenue }) => (
                                  <TableRow key={title}>
                                    <TableCell className="font-medium text-black">{title}</TableCell>
                                    <TableCell className="text-black">₹{revenue.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        {/* Previous/Completed Events Revenue */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-black">Previous/Completed Events Revenue</h3>
                          <div className="overflow-x-auto">
                            <Table className="text-black min-w-[320px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-black">Event</TableHead>
                                  <TableHead className="text-black">Revenue (₹)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {groupedPrevious.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                      No revenue for previous/completed events.
                                    </TableCell>
                                  </TableRow>
                                ) : groupedPrevious.map(({ title, revenue }) => (
                                  <TableRow key={title}>
                                    <TableCell className="font-medium text-black">{title}</TableCell>
                                    <TableCell className="text-black">₹{revenue.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        {/* Overall Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="rounded-lg bg-yellow-50 p-6 flex flex-col items-center">
                            <span className="text-lg font-semibold text-black mb-1">Current Events Total Revenue</span>
                            <span className="text-2xl font-bold text-yellow-700">₹{totalCurrentRevenue.toLocaleString()}</span>
                          </div>
                          <div className="rounded-lg bg-purple-50 p-6 flex flex-col items-center">
                            <span className="text-lg font-semibold text-black mb-1">Previous Events Total Revenue</span>
                            <span className="text-2xl font-bold text-purple-700">₹{totalPreviousRevenue.toLocaleString()}</span>
                          </div>
                          <div className="rounded-lg bg-green-50 p-6 flex flex-col items-center">
                            <span className="text-lg font-semibold text-black mb-1">Overall Total Revenue</span>
                            <span className="text-2xl font-bold text-green-700">₹{totalRevenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>

          <TabsContent value="events">
              <div className="grid grid-cols-1 gap-8">
                <FadeIn delay={100}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-black">All Events</span>
                        <span className="ml-4 text-sm text-black">Total: {events.length}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Event
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create New Event</DialogTitle>
                            </DialogHeader>
                            <EventForm onSubmit={handleCreateEvent} />
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                      <CardDescription className="text-black">
                        Manage your events and their details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-black">
                      <div className="rounded-md border">
                        <Table className="text-black">
                          <TableHeader className="text-black">
                            <TableRow className="text-black">
                              <TableHead className="text-black">Name</TableHead>
                              <TableHead className="text-black">Category</TableHead>
                              <TableHead className="text-black">Date</TableHead>
                              <TableHead className="text-black">Price</TableHead>
                              <TableHead className="text-black text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-black">
                            {getCurrentItems(events).map((event) => (
                              <TableRow key={event.id} className="text-black">
                                <TableCell className="font-medium text-black">{event.title}</TableCell>
                                <TableCell className="text-black">{event.category}</TableCell>
                                <TableCell className="text-black">{formatDate(event.date)}</TableCell>
                                <TableCell className="text-black">₹{event.price}</TableCell>
                                <TableCell className="text-black text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="ml-2"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        <div className="flex justify-end items-center space-x-2 p-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-black">
                            Page {currentPage} of {Math.ceil(events.length / itemsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(prev => 
                              Math.min(prev + 1, Math.ceil(events.length / itemsPerPage))
                            )}
                            disabled={currentPage === Math.ceil(events.length / itemsPerPage)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>
            </TabsContent>

            <TabsContent value="event-types">
              <div className="grid grid-cols-1 gap-8">
                <FadeIn delay={100}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-black">All Event Types</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Event Type
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create New Event Type</DialogTitle>
                            </DialogHeader>
                            <EventTypeForm onSubmit={handleCreateEventType} />
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                      <CardDescription className="text-black">
                        Manage your event types and their images
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-black">
                      <div className="rounded-md border">
                        <Table className="text-black">
                          <TableHeader className="text-black">
                            <TableRow className="text-black">
                              <TableHead className="text-black">Name</TableHead>
                              <TableHead className="text-black">Icon</TableHead>
                              <TableHead className="text-black">Image</TableHead>
                              <TableHead className="text-black">Sort Order</TableHead>
                              <TableHead className="text-black">Status</TableHead>
                              <TableHead className="text-black text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-black">
                            {eventTypes.map((eventType) => (
                              <TableRow key={eventType.id} className="text-black">
                                <TableCell className="font-medium text-black">{eventType.name}</TableCell>
                                <TableCell className="text-2xl text-black">{eventType.icon || "🎭"}</TableCell>
                                <TableCell>
                                  {eventType.image_url ? (
                                    <img
                                      src={eventType.image_url}
                                      alt={eventType.name}
                                      className="w-8 h-8 rounded object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-black text-sm">No image</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-black">{eventType.sort_order}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs text-black ${eventType.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {eventType.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-black text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEventType(eventType);
                                      setIsEventTypeEditDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  {eventType.deletable && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteEventType(eventType.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>

              {/* Edit Event Type Dialog */}
              <Dialog open={isEventTypeEditDialogOpen} onOpenChange={setIsEventTypeEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Event Type</DialogTitle>
                  </DialogHeader>
                  {selectedEventType && (
                    <EventTypeForm 
                      initialData={selectedEventType} 
                      onSubmit={handleUpdateEventType} 
                      isEditing={true} 
                    />
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="categories">
              <FadeIn delay={100}>
                <CategoryForm />
              </FadeIn>
            </TabsContent>

            <TabsContent value="experiences">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <FadeIn delay={100}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span className="text-black">All Experiences</span>
                          <Button size="sm">
                            <Plus className="mr-1 h-4 w-4" />
                            Add New
                          </Button>
                        </CardTitle>
                        <CardDescription>
                          Manage your curated experiences
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table className="text-black">
                            <TableHeader className="text-black">
                              <TableRow className="text-black">
                                <TableHead className="text-black">Name</TableHead>
                                <TableHead className="text-black">Description</TableHead>
                                <TableHead className="text-black text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="text-black">
                              {experiences.map((experience) => (
                                <TableRow key={experience.id} className="text-black">
                                  <TableCell className="font-medium text-black">{experience.name}</TableCell>
                                  <TableCell className="text-black">{experience.description}</TableCell>
                                  <TableCell className="text-black text-right space-x-2">
                                    <Button size="icon" variant="ghost">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                </div>
                
                <div>
                  <FadeIn delay={200}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Add New Experience</CardTitle>
                        <CardDescription>
                          Create a new curated experience
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddExperience} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="exp-name">Experience Name</Label>
                            <Input id="exp-name" placeholder="Enter experience name" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="exp-description">Description</Label>
                            <Textarea id="exp-description" placeholder="Enter description" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="exp-image">Experience Image</Label>
                            <Input id="exp-image" type="file" />
                          </div>
                          
                          <Button type="submit" className="w-full">
                            Create Experience
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </FadeIn>
                </div>
              </div>
              {/* Featured Artists Upload Section */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <FadeIn delay={250}>
                    <ArtistForm />
                  </FadeIn>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="banners">
              <div className="grid grid-cols-1 gap-8">
                <FadeIn delay={100}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-black">All Banners</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Banner
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create New Banner</DialogTitle>
                            </DialogHeader>
                            <BannerForm onSubmit={handleCreateBanner} />
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                      <CardDescription>
                        Manage your homepage banner sliders
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-black">
                      <div className="rounded-md border">
                        <Table className="text-black">
                          <TableHeader className="text-black">
                            <TableRow className="text-black">
                              <TableHead className="text-black">Title</TableHead>
                              <TableHead className="text-black">Subtitle</TableHead>
                              <TableHead className="text-black">Image</TableHead>
                              <TableHead className="text-black">Link</TableHead>
                              <TableHead className="text-black">Sort Order</TableHead>
                              <TableHead className="text-black">Status</TableHead>
                              <TableHead className="text-black text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-black">
                            {banners.map((banner) => (
                              <TableRow key={banner.id} className="text-black">
                                <TableCell className="font-medium text-black">{banner.title}</TableCell>
                                <TableCell className="max-w-[200px] truncate text-black">
                                  {banner.subtitle || "No subtitle"}
                                </TableCell>
                                <TableCell>
                                  <div className="w-16 h-10 rounded overflow-hidden">
                                    <img 
                                      src={banner.image_url} 
                                      alt={banner.title} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[150px] truncate text-black">
                                  {banner.link_url || "No link"}
                                </TableCell>
                                <TableCell className="text-black">{banner.sort_order}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs text-black ${
                                    banner.is_active 
                                      ? 'bg-green-100' 
                                      : 'bg-red-100'
                                  }`}>
                                    {banner.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-black text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBanner(banner);
                                      setIsBannerEditDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteBanner(banner.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>

              {/* Edit Banner Dialog */}
              <Dialog open={isBannerEditDialogOpen} onOpenChange={setIsBannerEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Banner</DialogTitle>
                  </DialogHeader>
                  {selectedBanner && (
                    <BannerForm 
                      initialData={selectedBanner} 
                      onSubmit={handleUpdateBanner} 
                      isEditing={true} 
                    />
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="testimonials">
              <div className="grid grid-cols-1 gap-8">
                {/* Pending Testimonials Section - always on top */}
                <FadeIn delay={50}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-black">Pending Testimonials</CardTitle>
                      <CardDescription>
                        Review and approve or reject new testimonials submitted by users.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table className="text-black">
                          <TableHeader className="text-black">
                            <TableRow className="text-black">
                              <TableHead className="text-black">Name</TableHead>
                              <TableHead className="text-black">Role</TableHead>
                              <TableHead className="text-black">Rating</TableHead>
                              <TableHead className="text-black">Content</TableHead>
                              <TableHead className="text-black">Status</TableHead>
                              <TableHead className="text-black text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-black">
                            {pendingTestimonials.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  No pending testimonials.
                                </TableCell>
                              </TableRow>
                            ) : pendingTestimonials.map((testimonial) => (
                              <TableRow key={testimonial.id} className="text-black">
                                <TableCell className="font-medium text-black">{testimonial.name}</TableCell>
                                <TableCell className="capitalize text-black">{testimonial.role}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-yellow text-yellow" />
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-md truncate text-black">{testimonial.content}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Pending</span>
                                </TableCell>
                                <TableCell className="text-black text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveTestimonial(testimonial.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectTestimonial(testimonial.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4 mr-1" /> Reject
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Approved/All Testimonials Section */}
                <FadeIn delay={100}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-black">All Testimonials</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Testimonial
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create New Testimonial</DialogTitle>
                            </DialogHeader>
                            <div className="p-4">
                              <p className="text-muted-foreground">Use the feedback form on the main site to create testimonials.</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                      <CardDescription>
                        Manage your testimonials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table className="text-black">
                          <TableHeader className="text-black">
                            <TableRow className="text-black">
                              <TableHead className="text-black">Name</TableHead>
                              <TableHead className="text-black">Testimonial</TableHead>
                              <TableHead className="text-black">Status</TableHead>
                              <TableHead className="text-black text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-black">
                            {testimonials.map((testimonial) => (
                              <TableRow key={testimonial.id} className="text-black">
                                <TableCell className="font-medium text-black">{testimonial.name}</TableCell>
                                <TableCell className="max-w-md truncate text-black">{testimonial.content}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs text-black ${
                                    testimonial.is_approved 
                                      ? 'bg-green-100' 
                                      : 'bg-red-100'
                                  }`}>
                                    {testimonial.is_approved ? 'Approved' : 'Pending'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-black text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTestimonial(testimonial);
                                      setIsTestimonialEditDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteTestimonial(testimonial.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>

              {/* Edit Testimonial Dialog */}
              <Dialog open={isTestimonialEditDialogOpen} onOpenChange={setIsTestimonialEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Testimonial</DialogTitle>
                  </DialogHeader>
                  {selectedTestimonial && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          defaultValue={selectedTestimonial.name}
                          onChange={(e) => setSelectedTestimonial({
                            ...selectedTestimonial,
                            name: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={selectedTestimonial.role}
                          onValueChange={(value) => setSelectedTestimonial({
                            ...selectedTestimonial,
                            role: value as 'audience' | 'artist' | 'organizer'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="audience">Event Attendee</SelectItem>
                            <SelectItem value="artist">Artist/Performer</SelectItem>
                            <SelectItem value="organizer">Event Organizer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rating">Rating</Label>
                        <Select
                          value={selectedTestimonial.rating.toString()}
                          onValueChange={(value) => setSelectedTestimonial({
                            ...selectedTestimonial,
                            rating: parseInt(value)
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <SelectItem key={rating} value={rating.toString()}>
                                {rating} Star{rating > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          defaultValue={selectedTestimonial.content}
                          onChange={(e) => setSelectedTestimonial({
                            ...selectedTestimonial,
                            content: e.target.value
                          })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_approved"
                          checked={selectedTestimonial.is_approved}
                          onChange={(e) => setSelectedTestimonial({
                            ...selectedTestimonial,
                            is_approved: e.target.checked
                          })}
                        />
                        <Label htmlFor="is_approved">Approved</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={selectedTestimonial.is_featured}
                          onChange={(e) => setSelectedTestimonial({
                            ...selectedTestimonial,
                            is_featured: e.target.checked
                          })}
                        />
                        <Label htmlFor="is_featured">Featured</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsTestimonialEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleUpdateTestimonial({
                            name: selectedTestimonial.name,
                            role: selectedTestimonial.role,
                            content: selectedTestimonial.content,
                            rating: selectedTestimonial.rating,
                            is_approved: selectedTestimonial.is_approved,
                            is_featured: selectedTestimonial.is_featured
                          })}
                        >
                          Update Testimonial
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="bookings">
              <FadeIn delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-black">User Bookings</CardTitle>
                    <CardDescription className="text-black">
                      View and manage all user bookings, separated by event status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Event Booking Count Summary */}
                    {bookings.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-2 text-black">Seats Booked Per Event</h3>
                        {(() => {
                          const now = new Date('2025-08-07T13:05:04+05:30');
                          // Helper to group bookings by event and sum tickets
                          const groupByEvent = (bookingsList) => {
                            const eventTicketMap = new Map();
                            bookingsList.forEach(booking => {
                              const eventId = booking.event_id;
                              const eventTitle = booking.event?.title || 'Event not found';
                              if (!eventTicketMap.has(eventId)) {
                                eventTicketMap.set(eventId, { title: eventTitle, count: 0 });
                              }
                              eventTicketMap.get(eventId).count += booking.tickets;
                            });
                            return Array.from(eventTicketMap.values())
                              .sort((a, b) => a.title.localeCompare(b.title));
                          };
                          // Split bookings by event status
                          const currentEventBookings = bookings.filter(
                            b => b.event?.date && new Date(b.event.date) >= now
                          );
                          const previousEventBookings = bookings.filter(
                            b => b.event?.date && new Date(b.event.date) < now
                          );
                          const groupedCurrent = groupByEvent(currentEventBookings);
                          const groupedPrevious = groupByEvent(previousEventBookings);
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="font-semibold mb-2 text-black">Current/Ongoing Events</h4>
                                <div className="overflow-x-auto">
                                  <Table className="text-black min-w-[320px]">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-black">Event</TableHead>
                                        <TableHead className="text-black">Total Seats Booked</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {groupedCurrent.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                            No bookings for current/ongoing events.
                                          </TableCell>
                                        </TableRow>
                                      ) : groupedCurrent.map(({ title, count }) => (
                                        <TableRow key={title}>
                                          <TableCell className="font-medium text-black">{title}</TableCell>
                                          <TableCell className="text-black">{count}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2 text-black">Previous/Completed Events</h4>
                                <div className="overflow-x-auto">
                                  <Table className="text-black min-w-[320px]">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-black">Event</TableHead>
                                        <TableHead className="text-black">Total Seats Booked</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {groupedPrevious.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                            No bookings for previous/completed events.
                                          </TableCell>
                                        </TableRow>
                                      ) : groupedPrevious.map(({ title, count }) => (
                                        <TableRow key={title}>
                                          <TableCell className="font-medium text-black">{title}</TableCell>
                                          <TableCell className="text-black">{count}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {bookingsLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-black">No Bookings Found</h3>
                        <p className="text-muted-foreground">
                          There are no bookings in the system yet.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Split bookings by event status */}
                        {(() => {
                          const now = new Date('2025-08-07T13:01:50+05:30');
                          const isCurrentEvent = (booking) => {
                            if (!booking.event?.date) return false;
                            return new Date(booking.event.date) >= now;
                          };
                          const isPastEvent = (booking) => {
                            if (!booking.event?.date) return false;
                            return new Date(booking.event.date) < now;
                          };
                          const currentBookings = bookings.filter(isCurrentEvent);
                          const previousBookings = bookings.filter(isPastEvent);

                          const filterBookings = (list) => list.filter((booking) => {
                            const matchesSearch =
                              booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (booking.event?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
                            return matchesSearch && matchesStatus;
                          });
                          const filteredCurrent = filterBookings(currentBookings);
                          const filteredPrevious = filterBookings(previousBookings);

                          return (
                            <div className="space-y-12">
                              {/* Current Bookings */}
                              <div>
                                <h3 className="text-xl font-bold mb-2 text-black">Current Bookings (Ongoing/Upcoming Events)</h3>
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                  <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                      placeholder="Search by name, email, or event..."
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="pl-10"
                                    />
                                  </div>
                                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                      <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Status</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="mb-2">
                                  <p className="text-sm text-muted-foreground">
                                    Showing {filteredCurrent.length} of {currentBookings.length} current bookings
                                  </p>
                                </div>
                                <div className="rounded-md border">
                                  <Table className="text-black">
                                    <TableHeader className="text-black">
                                      <TableRow className="text-black">
                                        <TableHead className="text-black">Event</TableHead>
                                        <TableHead className="text-black">User</TableHead>
                                        <TableHead className="text-black">Email</TableHead>
                                        <TableHead className="text-black">Phone</TableHead>
                                        <TableHead className="text-black">Tickets</TableHead>
                                        <TableHead className="text-black">Amount</TableHead>
                                        <TableHead className="text-black">Status</TableHead>
                                        <TableHead className="text-black">Booking Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-black">
                                      {filteredCurrent.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            No current bookings found.
                                          </TableCell>
                                        </TableRow>
                                      ) : getCurrentItems(filteredCurrent).map((booking) => (
                                        <TableRow key={booking.id} className="text-black">
                                          <TableCell className="font-medium text-black">
                                            {booking.event?.title || 'Event not found'}
                                          </TableCell>
                                          <TableCell className="text-black">{booking.name}</TableCell>
                                          <TableCell className="text-black">{booking.email}</TableCell>
                                          <TableCell className="text-black">{booking.phone}</TableCell>
                                          <TableCell className="text-black">{booking.tickets}</TableCell>
                                          <TableCell className="text-black">₹{booking.amount.toLocaleString()}</TableCell>
                                          <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-black ${
                                              booking.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {booking.status}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-black">{formatDate(booking.booking_date)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                {totalPages(filteredCurrent) > 1 && (
                                  <div className="flex justify-end items-center space-x-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                      disabled={currentPage === 1}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                      Page {currentPage} of {totalPages(filteredCurrent)}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages(filteredCurrent)))}
                                      disabled={currentPage === totalPages(filteredCurrent)}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {/* Previous Bookings */}
                              <div>
                                <h3 className="text-xl font-bold mb-2 text-black">Previous Bookings (Completed Events)</h3>
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                  <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                      placeholder="Search by name, email, or event..."
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="pl-10"
                                    />
                                  </div>
                                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                      <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Status</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="mb-2">
                                  <p className="text-sm text-muted-foreground">
                                    Showing {filteredPrevious.length} of {previousBookings.length} previous bookings
                                  </p>
                                </div>
                                <div className="rounded-md border">
                                  <Table className="text-black">
                                    <TableHeader className="text-black">
                                      <TableRow className="text-black">
                                        <TableHead className="text-black">Event</TableHead>
                                        <TableHead className="text-black">User</TableHead>
                                        <TableHead className="text-black">Email</TableHead>
                                        <TableHead className="text-black">Phone</TableHead>
                                        <TableHead className="text-black">Tickets</TableHead>
                                        <TableHead className="text-black">Amount</TableHead>
                                        <TableHead className="text-black">Status</TableHead>
                                        <TableHead className="text-black">Booking Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-black">
                                      {filteredPrevious.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            No previous bookings found.
                                          </TableCell>
                                        </TableRow>
                                      ) : getCurrentItems(filteredPrevious).map((booking) => (
                                        <TableRow key={booking.id} className="text-black">
                                          <TableCell className="font-medium text-black">
                                            {booking.event?.title || 'Event not found'}
                                          </TableCell>
                                          <TableCell className="text-black">{booking.name}</TableCell>
                                          <TableCell className="text-black">{booking.email}</TableCell>
                                          <TableCell className="text-black">{booking.phone}</TableCell>
                                          <TableCell className="text-black">{booking.tickets}</TableCell>
                                          <TableCell className="text-black">₹{booking.amount.toLocaleString()}</TableCell>
                                          <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-black ${
                                              booking.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {booking.status}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-black">{formatDate(booking.booking_date)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                {totalPages(filteredPrevious) > 1 && (
                                  <div className="flex justify-end items-center space-x-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                      disabled={currentPage === 1}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                      Page {currentPage} of {totalPages(filteredPrevious)}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages(filteredPrevious)))}
                                      disabled={currentPage === totalPages(filteredPrevious)}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            </TabsContent>

            <TabsContent value="hosts">
              <FadeIn delay={100}>
                <div className="grid grid-cols-1 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-black">Host Management</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Invite Host
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite New Host</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Label htmlFor="invite-host-email">Host Email</Label>
                              <Input
                                id="invite-host-email"
                                type="email"
                                placeholder="Enter host email"
                                value={hostInviteEmail}
                                onChange={(e) => setHostInviteEmail(e.target.value)}
                              />
                              <Button 
                                onClick={handleInviteHost} 
                                disabled={hostInviteLoading}
                                className="w-full"
                              >
                                {hostInviteLoading ? "Sending..." : "Send Invitation"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                      <CardDescription>
                        Manage host invitations and assignments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hostInvitationsLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {hostInvitations.length === 0 ? (
                            <div className="text-center py-8">
                              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Host Invitations</h3>
                              <p className="text-gray-500 mb-4">
                                Start by inviting hosts to manage your events.
                              </p>
                              <Button onClick={() => setIsHostInviteDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Invite First Host
                              </Button>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Invited By</TableHead>
                                  <TableHead>Created</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {hostInvitations.map((invitation) => (
                                  <TableRow key={invitation.id}>
                                    <TableCell>{invitation.email}</TableCell>
                                    <TableCell>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        invitation.status === 'pending' 
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : invitation.status === 'accepted'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {invitation.status}
                                      </span>
                                    </TableCell>
                                    <TableCell>{invitation.invited_by}</TableCell>
                                    <TableCell>{formatDate(invitation.created_at)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteHostInvitation(invitation.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </FadeIn>
            </TabsContent>

            <TabsContent value="host-activity">
              <FadeIn delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-black">Host Activity</CardTitle>
                    <CardDescription>See which host is managing which event, tickets sold, attendees, and revenue.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="text-black">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Host</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Tickets Sold</TableHead>
                            <TableHead>Attendees</TableHead>
                            <TableHead>Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hostActivity.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center">No host activity found.</TableCell>
                            </TableRow>
                          ) : (
                            hostActivity.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.hostName}</TableCell>
                                <TableCell>{row.eventTitle}</TableCell>
                                <TableCell>{row.eventDate}</TableCell>
                                <TableCell>{row.ticketsSold}</TableCell>
                                <TableCell>{row.attendees}</TableCell>
                                <TableCell>₹{row.revenue.toLocaleString()}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </TabsContent>

            <TabsContent value="overview">
              <FadeIn delay={100}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                          <p className="text-2xl font-bold text-black">{events?.length || 0}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                          <p className="text-2xl font-bold text-black">{bookings.length}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                          <p className="text-2xl font-bold text-black">₹{bookings.reduce((sum, booking) => sum + booking.amount, 0).toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Completed Events</p>
                          <p className="text-2xl font-bold text-black">
                            {events?.filter(event => {
                              const eventDate = new Date(event.date);
                              const now = new Date();
                              return eventDate < now;
                            }).length || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Event Management
                      </CardTitle>
                      <CardDescription>
                        Manage completed events and attendance tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">Process Completed Events</h4>
                            <p className="text-sm text-muted-foreground">
                              Automatically mark tickets as attended for events that have ended
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={handleTestCompletedEvents}
                            >
                              Test
                            </Button>
                            <Button 
                              onClick={handleProcessCompletedEvents}
                              disabled={isProcessingEvents}
                            >
                              {isProcessingEvents ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Process Events
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription>
                        Common administrative tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start" 
                          onClick={() => setSelectedEvent(null)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Event
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => setCurrentTab('bookings')}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View All Bookings
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={handleGenerateSystemReport}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          System Reports
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={handleDownloadSystemReport}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </FadeIn>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventForm
              initialData={selectedEvent}
              onSubmit={handleUpdateEvent}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Invite Admin Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="invite-admin-email">Admin Email</Label>
            <Input
              id="invite-admin-email"
              type="email"
              placeholder="Enter admin email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button 
              onClick={handleInviteAdmin} 
              disabled={inviteLoading}
              className="w-full"
            >
              {inviteLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Host Dialog */}
      <Dialog open={isHostInviteDialogOpen} onOpenChange={setIsHostInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Host</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="invite-host-email">Host Email</Label>
            <Input
              id="invite-host-email"
              type="email"
              placeholder="Enter host email"
              value={hostInviteEmail}
              onChange={e => setHostInviteEmail(e.target.value)}
            />
            <Button
              onClick={handleInviteHost}
              disabled={hostInviteLoading}
              className="w-full"
            >
              {hostInviteLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function AdminDashboardProtected() {
  return (
    <ProtectedRoute adminOnly>
      <AdminDashboard />
    </ProtectedRoute>
  );
}