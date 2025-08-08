import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  RefreshCw,
  QrCode,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Check,
  X
} from "lucide-react";
import { 
  getHostProfile,
  getHostEvents,
  getEventTickets,
  searchTicketByNumber,
  markAttendance,
  getAttendanceSummary,
  getHostDashboardData,
  subscribeToAttendanceRecords
} from "@/services/hostService";
import { Event } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import EventForm from "@/components/admin/EventForm";
import { createEvent } from "@/services/adminEventService";
import { supabase } from "@/integrations/supabase/client";

const HostDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { signOut, isHost } = useAuth();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('overview');
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent'>('present');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  // Fetch host profile
  const { data: hostProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['host-profile'],
    queryFn: getHostProfile,
    enabled: isHost
  });

  // Fetch host events
  const { data: hostEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['host-events'],
    queryFn: getHostEvents,
    enabled: isHost
  });

  // Fetch host dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['host-dashboard-data'],
    queryFn: getHostDashboardData,
    enabled: isHost
  });

  // Fetch attendance summary
  const { data: attendanceSummary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['host-attendance-summary'],
    queryFn: getAttendanceSummary,
    enabled: isHost
  });

  // Fetch event tickets when event is selected
  const { data: eventTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['event-tickets', selectedEvent?.id],
    queryFn: () => selectedEvent ? getEventTickets(selectedEvent.id) : Promise.resolve([]),
    enabled: !!selectedEvent
  });

  // Subscribe to real-time attendance updates
  useEffect(() => {
    if (!isHost) return;

    const unsubscribe = subscribeToAttendanceRecords((payload) => {
      queryClient.invalidateQueries({ queryKey: ['host-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['host-dashboard-data'] });
      if (selectedEvent) {
        queryClient.invalidateQueries({ queryKey: ['event-tickets', selectedEvent.id] });
      }
      toast({
        title: "Attendance Updated",
        description: "Attendance records have been updated.",
      });
    });

    // Subscribe to events table changes for real-time updates
    const eventsSubscription = supabase
      .channel('host-events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        (payload) => {
          console.log('Event change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['host-events'] });
          queryClient.invalidateQueries({ queryKey: ['host-dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['host-attendance-summary'] });
          toast({
            title: "Events Updated",
            description: "The events list has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(eventsSubscription);
    };
  }, [isHost, queryClient, toast, selectedEvent]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedEvent || !ticketNumber.trim()) {
      toast({
        title: "Error",
        description: "Please select an event and enter a ticket number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First search for the ticket
      const ticket = await searchTicketByNumber(ticketNumber.trim(), selectedEvent.id);
      if (!ticket) {
        toast({
          title: "Ticket Not Found",
          description: "No ticket found with this number for the selected event.",
          variant: "destructive"
        });
        return;
      }

      // Mark attendance
      const result = await markAttendance(
        ticket.id,
        selectedEvent.id,
        attendanceStatus,
        attendanceNotes
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `Attendance marked as ${attendanceStatus}`,
        });
        setIsAttendanceDialogOpen(false);
        setTicketNumber('');
        setAttendanceNotes('');
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['host-attendance-summary'] });
        queryClient.invalidateQueries({ queryKey: ['host-dashboard-data'] });
        queryClient.invalidateQueries({ queryKey: ['event-tickets', selectedEvent.id] });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark attendance",
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
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be a host to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/host/login")} className="w-full">
              Go to Host Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-violet" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {hostProfile?.host_name || 'Host'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Site
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Total Experiences</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.total_events || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Total Tickets</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.total_tickets || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Present</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.present_tickets || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.absent_tickets || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
              <TabsTrigger value="events">My Experiences</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
                <CardHeader>
                  <CardTitle>Recent Attendance Summary</CardTitle>
                  <CardDescription>
                    Overview of attendance for your recent experiences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attendanceSummary.slice(0, 5).map((event) => (
                        <div key={event.event_id} className="flex items-center justify-between p-4 border rounded-lg bg-white/80 text-violet">
                          <div>
                            <h3 className="font-semibold">{event.event_title}</h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(event.event_date || '')} • {event.event_city}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm text-gray-600">Present</p>
                                <p className="font-semibold text-green-600">{event.present_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Absent</p>
                                <p className="font-semibold text-red-600">{event.absent_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Rate</p>
                                <p className="font-semibold">{event.attendance_rate || 0}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mark Attendance Tab */}
            <TabsContent value="attendance" className="space-y-6">
              <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
                <CardHeader>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>
                    Mark attendees as present or absent for your experiences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Selection */}
                  <div className="space-y-2">
                    <Label>Select Experience</Label>
                    <Select onValueChange={(value) => {
                      const event = hostEvents.find(e => e.id === value);
                      setSelectedEvent(event || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {formatDate(event.date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick Attendance Marking */}
                  <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        Mark Attendance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mark Attendance</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Ticket Number</Label>
                          <Input
                            placeholder="Enter ticket number"
                            value={ticketNumber}
                            onChange={(e) => setTicketNumber(e.target.value)}
                            className="bg-yellow/10 text-violet"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={attendanceStatus} onValueChange={(value: 'present' | 'absent') => setAttendanceStatus(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            placeholder="Add any notes..."
                            value={attendanceNotes}
                            onChange={(e) => setAttendanceNotes(e.target.value)}
                            className="bg-yellow/10 text-violet"
                          />
                        </div>
                        <Button onClick={handleMarkAttendance} disabled={loading} className="w-full">
                          {loading ? "Marking..." : "Mark Attendance"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Event Tickets Table */}
                  {selectedEvent && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-violet">Tickets for {selectedEvent.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 bg-yellow/10 text-violet"
                          />
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {ticketsLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : (
                        <Table className="bg-white/80 text-violet">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticket #</TableHead>
                              <TableHead>Attendee</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventTickets
                              .filter(ticket => 
                                ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ticket.bookings?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ticket.bookings?.email.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((ticket) => (
                                <TableRow key={ticket.id}>
                                  <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                                  <TableCell>{ticket.bookings?.name}</TableCell>
                                  <TableCell>{ticket.bookings?.email}</TableCell>
                                  <TableCell>{ticket.bookings?.phone}</TableCell>
                                  <TableCell>
                                    {ticket.attended === true ? (
                                      <span className="flex items-center text-green-600">
                                        <Check className="h-4 w-4 mr-1" />
                                        Present
                                      </span>
                                    ) : ticket.attended === false ? (
                                      <span className="flex items-center text-red-600">
                                        <X className="h-4 w-4 mr-1" />
                                        Absent
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">Not marked</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setTicketNumber(ticket.ticket_number);
                                                setAttendanceStatus('present');
                                                setAttendanceNotes('');
                                                setIsAttendanceDialogOpen(true);
                                              }}
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Mark as Present</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setTicketNumber(ticket.ticket_number);
                                                setAttendanceStatus('absent');
                                                setAttendanceNotes('');
                                                setIsAttendanceDialogOpen(true);
                                              }}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Mark as Absent</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
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
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Experiences</CardTitle>
                    <CardDescription>
                      Experiences you are hosting or managing
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateEventOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Experience
                  </Button>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg bg-white/80 text-violet">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <p className="text-sm text-gray-600">
                                {formatDate(event.date)} • {formatTime(event.time)} • {event.venue}
                              </p>
                              <p className="text-sm text-gray-500">{event.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event as Event);
                                setCurrentTab('attendance');
                              }}
                            >
                              Manage Attendance
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Experience</DialogTitle>
                  </DialogHeader>
                  <EventForm
                    onSubmit={async (data) => {
                      if (!hostProfile) return;
                      await createEvent({ 
                        ...data, 
                        host: hostProfile.id, 
                        title: data.title || 'New Event',
                        description: data.description || 'A great experience awaits!',
                        date: data.date || new Date().toISOString().split('T')[0],
                        time: data.time || '18:00',
                        venue: data.venue || 'TBD',
                        city: data.city || 'Mumbai',
                        category: data.category || 'experience',
                        price: data.base_price || data.ticket_price || 0,
                        image: (data as any).image || (data as any).images?.[0] || 'https://via.placeholder.com/800x600' 
                      });
                      setIsCreateEventOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['host-events'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="bg-sandstorm/80 rounded-2xl p-4 shadow-soft">
                <CardHeader>
                  <CardTitle>Attendance Reports</CardTitle>
                  <CardDescription>
                    Detailed attendance statistics and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {attendanceSummary.map((event) => (
                      <div key={event.event_id} className="border rounded-lg p-6 bg-white/80 text-violet">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{event.event_title}</h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(event.event_date || '')} • {event.event_city}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{event.attendance_rate || 0}%</p>
                            <p className="text-sm text-gray-600">Attendance Rate</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{event.total_tickets || 0}</p>
                            <p className="text-sm text-gray-600">Total Tickets</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{event.present_count || 0}</p>
                            <p className="text-sm text-gray-600">Present</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{event.absent_count || 0}</p>
                            <p className="text-sm text-gray-600">Absent</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </div>
  );
};

export default function HostDashboardProtected() {
  return (
    <ProtectedRoute hostOnly>
      <HostDashboard />
    </ProtectedRoute>
  );
} 