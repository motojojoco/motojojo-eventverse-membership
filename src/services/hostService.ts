import { supabase } from "@/integrations/supabase/client";
import { Event } from "./eventService";

export interface Host {
  id: string;
  user_id: string;
  host_name: string;
  phone?: string;
  city?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostInvitation {
  id: string;
  email: string;
  invited_by: string;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface AttendanceRecord {
  id: string;
  ticket_id: string;
  event_id: string;
  user_id: string;
  host_id: string;
  status: 'present' | 'absent';
  marked_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HostEvent {
  id: string;
  host_id: string;
  event_id: string;
  permissions: {
    mark_attendance: boolean;
    view_bookings: boolean;
    create_events: boolean;
  };
  created_at: string;
}

export interface AttendanceStats {
  total_tickets: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
  city_breakdown?: Record<string, {
    total: number;
    present: number;
    absent: number;
    rate: number;
  }>;
}

// Host Profile Management
export const getHostProfile = async (): Promise<Host | null> => {
  const { data, error } = await supabase
    .from('hosts')
    .select('*')
    .single();
  if (error) {
    console.error('Error fetching host profile:', error);
    return null;
  }
  return data;
};

// Host Invitation Management
export const createHostInvitation = async (email: string): Promise<{ success: boolean; invitation_id?: string; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }
  // Call the new function with UUID
  const { data, error } = await supabase.rpc('create_host_invitation', {
    p_email: email,
    p_invited_by: user.id
  });
  if (error) {
    console.error('Error creating host invitation:', error);
    return { success: false, error: error.message };
  }
  return { success: true, invitation_id: data };
};

export const acceptHostInvitation = async (
  invitationToken: string,
  hostName: string,
  phone?: string,
  city?: string,
  bio?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }
  // Call the new function with UUID
  const { data, error } = await supabase.rpc('accept_host_invitation', {
    p_token: invitationToken,
    p_user_id: user.id,
    p_host_name: hostName,
    p_phone: phone || null,
    p_city: city || null,
    p_bio: bio || null
  });
  if (error) {
    console.error('Error accepting host invitation:', error);
    return { success: false, error: error.message };
  }
  return { success: !!data, message: data ? 'Host invitation accepted successfully' : undefined };
};

export const getHostInvitations = async (): Promise<HostInvitation[]> => {
  const { data, error } = await supabase
    .from('host_invitations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching host invitations:', error);
    return [];
  }
  return (data || []).map(invitation => ({
    ...invitation,
    status: invitation.status as "pending" | "accepted" | "expired"
  }));
};

export const deleteHostInvitation = async (invitationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('host_invitations')
    .delete()
    .eq('id', invitationId);
  if (error) {
    console.error('Error deleting host invitation:', error);
    return false;
  }
  return true;
};

// Host Event Management
export const getHostEvents = async (): Promise<Event[]> => {
  // Get the current user's host profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return [];
  }

  // Get the host profile
  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    console.error('Host profile not found');
    return [];
  }

  // Fetch events directly from events table where host field matches
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host', hostProfile.id)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching host events:', error);
    return [];
  }

  return (data || []).map((event: any) => ({
    ...event,
    gallery: event.gallery || [],
    featured: event.featured || false,
    created_by: event.created_by || event.host
  }));
};

export const assignHostToEvent = async (hostId: string, eventId: string, permissions?: any): Promise<boolean> => {
  const { error } = await supabase
    .from('host_events')
    .insert({
      host_id: hostId,
      event_id: eventId,
      permissions: permissions || {
        mark_attendance: true,
        view_bookings: true,
        create_events: true
      }
    });
  if (error) {
    console.error('Error assigning host to event:', error);
    return false;
  }
  return true;
};

export const removeHostFromEvent = async (hostId: string, eventId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('host_events')
    .delete()
    .eq('host_id', hostId)
    .eq('event_id', eventId);
  if (error) {
    console.error('Error removing host from event:', error);
    return false;
  }
  return true;
};

// Attendance Management
export const markAttendance = async (
  ticketId: string,
  eventId: string,
  status: 'present' | 'absent',
  notes?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  // This should call an RPC or insert into attendance_records as per your backend
  // Determine host_id and user_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }
  const { data: hostProfile, error: hostErr } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (hostErr || !hostProfile) {
    return { success: false, error: 'Host profile not found' };
  }
  const { data: ticketRow, error: ticketErr } = await supabase
    .from('tickets')
    .select('booking_id')
    .eq('id', ticketId)
    .single();
  if (ticketErr || !ticketRow) {
    return { success: false, error: 'Ticket not found' };
  }
  const { data: bookingRow, error: bookingErr } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', ticketRow.booking_id)
    .single();
  if (bookingErr || !bookingRow) {
    return { success: false, error: 'Booking not found' };
  }
  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      ticket_id: ticketId,
      event_id: eventId,
      status,
      notes: notes || null,
      host_id: hostProfile.id,
      user_id: bookingRow.user_id
    })
    .select()
    .single();
  if (error) {
    console.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
  return { success: true, message: 'Attendance marked successfully' };
};

export const getAttendanceRecords = async (eventId?: string): Promise<AttendanceRecord[]> => {
  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      tickets (
        ticket_number,
        username
      ),
      events (
        title,
        date,
        time
      ),
      users (
        full_name,
        email
      )
    `)
    .order('marked_at', { ascending: false });
  if (eventId) {
    query = query.eq('event_id', eventId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }
  return (data || []).map(record => ({
    ...record,
    status: record.status as "present" | "absent"
  }));
};

// Host Dashboard Data
export const getHostDashboardData = async () => {
  // Get the current user's host profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Get the host profile
  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    console.error('Host profile not found');
    return null;
  }

  // Get events for this host
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('host', hostProfile.id);

  if (!events) {
    return {
      total_events: 0,
      total_tickets: 0,
      present_tickets: 0,
      absent_tickets: 0
    };
  }

  const eventIds = events.map(e => e.id);

  // Get tickets for these events
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id,
      bookings!inner(event_id)
    `)
    .in('bookings.event_id', eventIds);

  const totalTickets = tickets?.length || 0;

  const { data: presentRecs } = await supabase
    .from('attendance_records')
    .select('id')
    .in('event_id', eventIds)
    .eq('status', 'present');

  const { data: absentRecs } = await supabase
    .from('attendance_records')
    .select('id')
    .in('event_id', eventIds)
    .eq('status', 'absent');

  return {
    total_events: events.length,
    total_tickets: totalTickets,
    present_tickets: presentRecs?.length || 0,
    absent_tickets: absentRecs?.length || 0
  };
};

export const getAttendanceSummary = async () => {
  // Get the current user's host profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return [];
  }

  // Get the host profile
  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    console.error('Host profile not found');
    return [];
  }

  // Get events for this host with attendance data
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      date,
      city
    `)
    .eq('host', hostProfile.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance summary:', error);
    return [];
  }

  if (!data) return [];

  // Calculate attendance statistics for each event using attendance_records
  const summaries = await Promise.all(
    data.map(async (event: any) => {
      const { data: present } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('event_id', event.id)
        .eq('status', 'present');
      const { data: absent } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('event_id', event.id)
        .eq('status', 'absent');
      const totalTicketsRes = await supabase
        .from('tickets')
        .select('id, bookings!inner(event_id)')
        .eq('bookings.event_id', event.id);
      const totalTickets = totalTicketsRes.data?.length || 0;
      const presentCount = present?.length || 0;
      const absentCount = absent?.length || 0;
      const attendanceRate = totalTickets > 0 ? Math.round((presentCount / totalTickets) * 100) : 0;
      return {
        event_id: event.id,
        event_title: event.title,
        event_city: event.city,
        event_date: event.date,
        total_tickets: totalTickets,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_rate: attendanceRate
      };
    })
  );
  return summaries;
};

// Ticket Management for Hosts
export const getEventTickets = async (eventId: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      bookings (
        id,
        name,
        email,
        phone,
        booking_date
      )
    `)
    .eq('bookings.event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event tickets:', error);
    return [];
  }

  return data || [];
};

export const searchTicketByNumber = async (ticketNumber: string, eventId: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      bookings (
        id,
        name,
        email,
        phone,
        booking_date,
        event_id
      )
    `)
    .eq('ticket_number', ticketNumber)
    .eq('bookings.event_id', eventId)
    .single();

  if (error) {
    console.error('Error searching ticket:', error);
    return null;
  }

  return data;
};

// Real-time subscriptions
export const subscribeToHostEvents = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('host-events-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'host_events'
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToAttendanceRecords = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('attendance-records-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attendance_records'
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Utility functions
export const isHost = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'host';
};

export const getHostPermissions = async (eventId: string): Promise<any> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('host_events')
    .select('permissions')
    .eq('event_id', eventId)
    .eq('hosts.user_id', user.id)
    .single();

  return data?.permissions || null;
};

// Fetch all hosts (for admin use)
export const getAllHosts = async (): Promise<Host[]> => {
  const { data, error } = await supabase
    .from('hosts')
    .select('*')
    .order('host_name', { ascending: true });
  if (error) {
    console.error('Error fetching all hosts:', error);
    return [];
  }
  return data || [];
}; 