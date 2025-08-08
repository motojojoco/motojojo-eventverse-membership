import { supabase } from "@/integrations/supabase/client";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";


const sesClient = new SESv2Client({ region: "ap-south-1", credentials:{
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
} });

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  tickets: number;
  amount: number;
  status: string;
  payment_id?: string;
  order_id?: string;
  booking_date: string;
  event?: any;
  ticket_items?: Ticket[]; // Renamed from tickets to ticket_items to avoid conflict
  ticket_names?: string[]; // Add this line to fix linter error
}

export interface Ticket {
  id: string;
  booking_id: string;
  ticket_number: string;
  qr_code?: string;
  username?: string;
  created_at: string;
  attended?: boolean;
  attended_at?: string;
}

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      event:event_id (*),
      ticket_items:tickets (*)
    `)
    .eq('user_id', userId)
    .order('booking_date', { ascending: false });
    
  if (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
  
  return data || [];
};

export const getBookingTickets = async (bookingId: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error(`Error fetching tickets for booking ${bookingId}:`, error);
    return [];
  }
  
  return data || [];
};

export const subscribeToBookingUpdates = (
  bookingId: string, 
  onUpdate: (tickets: Ticket[]) => void
) => {
  const channel = supabase
    .channel(`booking-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `booking_id=eq.${bookingId}`
      },
      async (payload) => {
        console.log('Ticket update received:', payload);
        // Fetch latest tickets after any change
        const tickets = await getBookingTickets(bookingId);
        onUpdate(tickets);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const createBookingFromCart = async (
  userId: string, 
  eventId: string, 
  name: string, 
  email: string, 
  phone: string, 
  tickets: number, 
  amount: number,
  ticketNames?: string[]
): Promise<Booking | null> => {
  try {
    // Create the booking first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        event_id: eventId,
        name,
        email,
        phone,
        tickets,
        amount,
        status: 'confirmed',
        booking_date: new Date().toISOString(),
        ticket_names: ticketNames && Array.isArray(ticketNames) ? ticketNames : null
      })
      .select()
      .single();
      
    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return null;
    }

    // Debug: log ticket creation
    console.log('Creating', tickets, 'tickets for booking', booking.id, 'with names:', ticketNames);

    // Generate tickets for the booking
    const ticketNumbers: string[] = [];
    const qrCodes: string[] = [];

    for (let i = 0; i < tickets; i++) {
      let ticketHolderName = name;
      if (ticketNames && Array.isArray(ticketNames)) {
        if (ticketNames[i] && ticketNames[i].trim()) {
          ticketHolderName = ticketNames[i].trim();
        } else if (ticketNames.length < tickets) {
          // If not enough names, fallback to numbered names
          ticketHolderName = `${name} ${i + 1}`;
        }
      } else {
        ticketHolderName = `${name} ${i + 1}`;
      }
      const ticketNumber = `MJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNumber}`;
      try {
        const { error: ticketError } = await supabase
          .from('tickets')
          .insert({
            booking_id: booking.id,
            ticket_number: ticketNumber,
            username: ticketHolderName,
          });
        if (ticketError) {
          console.error("Error creating ticket:", ticketError);
          continue;
        }
        if (!ticketError) {
          ticketNumbers.push(ticketNumber);
          qrCodes.push(qrCode);
        }
      } catch (err) {
        console.error('Exception during ticket creation:', err);
        continue;
      }
    }

    // Get event details for email
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventData && ticketNumbers.length > 0) {
      // Send email with tickets
      try {
        await supabase.functions.invoke('send-ticket', {
          body: {
            email: email,
            name: name,
            eventTitle: eventData.title,
            eventDate: eventData.date,
            eventTime: eventData.time,
            eventVenue: `${eventData.venue}, ${eventData.city}`,
            ticketNumbers,
            qrCodes,
            ticketHolderNames: ticketNames
          }
        });
        console.log('Ticket email sent successfully for booking:', booking.id);
      } catch (emailError) {
        console.error('Error sending ticket email:', emailError);
        // Don't throw error here as booking was successful
      }

      // Send WhatsApp message with ticket details
      try {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            to: phone,
            eventTitle: eventData.title,
            ticketCount: tickets,
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

    // send email using AWS SES directly
    try {
      const sesParams = {
        FromEmailAddress: 'Mojo Event <info@motojojo.co>',
        Destination: {
          ToAddresses: [booking.email]
        },
        Content: {
          Simple: {
            Subject: {
              Data: `Your Booking Confirmation for ${eventData?.title || 'Mojo Event'}`,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Thank you for your booking!</h2>
                  <p>Hello ${name},</p>
                  <p>Your booking for <strong>${eventData?.title || 'Mojo Event'}</strong> has been confirmed.</p>
                  <p><strong>Booking Details:</strong></p>
                  <ul>
                    <li>Event: ${eventData?.title || 'Mojo Event'}</li>
                    <li>Date: ${eventData?.date || 'TBA'}</li>
                    <li>Time: ${eventData?.time || 'TBA'}</li>
                    <li>Venue: ${eventData?.venue || ''}, ${eventData?.city || ''}</li>
                    <li>Number of Tickets: ${tickets}</li>
                  </ul>
                  <p>Your tickets have been generated and are attached to this email. You can also view them in your account.</p>
                  <p>We look forward to seeing you at the event!</p>
                  <p>Best regards,<br>The Mojo Event Team</p>
                </div>
                `,
                Charset: 'UTF-8'
              },
              Text: {
                Data: `Thank you for your booking!\n\nHello ${name},\n\nYour booking for ${eventData?.title || 'Mojo Event'} has been confirmed.\n\nBooking Details:\n- Event: ${eventData?.title || 'Mojo Event'}\n- Date: ${eventData?.date || 'TBA'}\n- Time: ${eventData?.time || 'TBA'}\n- Venue: ${eventData?.venue || ''}, ${eventData?.city || ''}\n- Number of Tickets: ${tickets}\n\nYour tickets have been generated and are attached to this email. You can also view them in your account.\n\nWe look forward to seeing you at the event!\n\nBest regards,\nThe Mojo Event Team`,
                Charset: 'UTF-8'
              }
            }
          }
        }
      };
      
      await sesClient.send(new SendEmailCommand(sesParams));
      console.log('Email sent successfully for booking:', booking.id);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't throw error here as booking was successful
    }

    
    return booking;
  } catch (err) {
    console.error("Error in createBookingFromCart:", err);
    return null;
  }
};

// Function to manually generate tickets for a booking if they don't exist
export const generateTicketsForBooking = async (booking: Booking): Promise<boolean> => {
  try {
    // Check if tickets already exist for this booking
    const { data: existingTickets, error: checkError } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', booking.id);
    
    if (checkError) {
      console.error("Error checking existing tickets:", checkError);
      return false;
    }
    
    // If tickets already exist, don't create new ones
    if (existingTickets && existingTickets.length > 0) {
      console.log(`Tickets already exist for booking ${booking.id}`);
      return true;
    }
    
    // Generate tickets for the booking
    for (let i = 0; i < booking.tickets; i++) {
      const ticketNumber = `MJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNumber}`;
      
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
          booking_id: booking.id,
          ticket_number: ticketNumber,
          username: booking.name
        });

      if (ticketError) {
        console.error("Error creating ticket:", ticketError);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error("Error in generateTicketsForBooking:", err);
    return false;
  }
};

// Function to resend tickets via email
export const resendTicketEmail = async (booking: Booking): Promise<boolean> => {
  try {
    // Get event details
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', booking.event_id)
      .single();

    if (!eventData) {
      console.error('Event not found for booking:', booking.id);
      return false;
    }

    // Get tickets for this booking
    const tickets = await getBookingTickets(booking.id);
    
    if (tickets.length === 0) {
      console.error('No tickets found for booking:', booking.id);
      return false;
    }

    const ticketNumbers = tickets.map(ticket => ticket.ticket_number);
    const qrCodes = tickets.map(ticket => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.ticket_number}`);
    const ticketHolderNames = tickets.map(ticket => ticket.username || booking.name);

    // Send email with tickets
    await supabase.functions.invoke('send-ticket', {
      body: {
        email: booking.email,
        name: booking.name,
        eventTitle: eventData.title,
        eventDate: eventData.date,
        eventTime: eventData.time,
        eventVenue: `${eventData.venue}, ${eventData.city}`,
        ticketNumbers,
        qrCodes,
        ticketHolderNames
      }
    });

    console.log('Ticket email resent successfully for booking:', booking.id);
    return true;
  } catch (error) {
    console.error('Error resending ticket email:', error);
    return false;
  }
};

// Function to mark tickets as attended for completed events
export const markTicketsAsAttended = async (eventId: string): Promise<boolean> => {
  try {
    // Get all bookings for this event
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('event_id', eventId);
    
    if (bookingsError) {
      console.error("Error fetching bookings for event:", bookingsError);
      return false;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('No bookings found for event:', eventId);
      return true;
    }
    
    const bookingIds = bookings.map(booking => booking.id);
    
    // Update all tickets for these bookings to mark as attended
    const { error: fnError } = await supabase.functions.invoke('mark-attended', {
      body: { eventId }
    });
    if (fnError) {
      console.error('Error calling mark-attended:', fnError);
      return false;
    }
    console.log(`Marked attendance for event ${eventId} via edge function`);
    return true;
  } catch (err) {
    console.error("Error in markTicketsAsAttended:", err);
    return false;
  }
};

// Function to get attendance statistics for an event
export const getEventAttendanceStats = async (eventId: string): Promise<{
  totalTickets: number;
  attendedTickets: number;
  attendanceRate: number;
}> => {
  try {
    // First get all bookings for this event
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('event_id', eventId);
      
    if (bookingsError) {
      console.error("Error fetching bookings for attendance stats:", bookingsError);
      return { totalTickets: 0, attendedTickets: 0, attendanceRate: 0 };
    }
    
    // Then get tickets for these bookings
    const bookingIds = bookings?.map(booking => booking.id) || [];
    
    if (bookingIds.length === 0) {
      return { totalTickets: 0, attendedTickets: 0, attendanceRate: 0 };
    }
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id')
      .in('booking_id', bookingIds);
    
    if (error) {
      console.error("Error fetching attendance stats:", error);
      return { totalTickets: 0, attendedTickets: 0, attendanceRate: 0 };
    }
    
    const totalTickets = tickets?.length || 0;
    const { data: presentRecs } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'present');
    const attendedTickets = presentRecs?.length || 0;
    const attendanceRate = totalTickets > 0 ? (attendedTickets / totalTickets) * 100 : 0;
    
    return {
      totalTickets,
      attendedTickets,
      attendanceRate
    };
  } catch (err) {
    console.error("Error in getEventAttendanceStats:", err);
    return { totalTickets: 0, attendedTickets: 0, attendanceRate: 0 };
  }
};

// Function to automatically mark tickets as attended for all completed events
export const processCompletedEvents = async (): Promise<{
  success: boolean;
  totalTicketsUpdated: number;
  results: any[];
}> => {
  try {
    console.log('Starting to process completed events...');
    
    // Try to call the Edge Function first
    const { data, error } = await supabase.functions.invoke('mark-attended');
    
    if (error) {
      console.error('Error calling mark-attended function:', error);
      console.log('Falling back to direct database processing...');
      
      // Fallback: Process directly in the client
      return await processCompletedEventsDirect();
    }
    
    console.log('Edge function result:', data);
    return {
      success: true,
      totalTicketsUpdated: data.totalTicketsUpdated || 0,
      results: data.results || []
    };
  } catch (err) {
    console.error('Error in processCompletedEvents:', err);
    console.log('Falling back to direct database processing...');
    
    // Fallback: Process directly in the client
    return await processCompletedEventsDirect();
  }
};

// Fallback function to process completed events directly
const processCompletedEventsDirect = async (): Promise<{
  success: boolean;
  totalTicketsUpdated: number;
  results: any[];
}> => {
  try {
    console.log('Processing completed events directly...');
    
    // Get all events that are completed
    const now = new Date();
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, date, time')
      .lt('date', now.toISOString().split('T')[0]);
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return {
        success: false,
        totalTicketsUpdated: 0,
        results: []
      };
    }
    
    if (!events || events.length === 0) {
      console.log('No completed events found');
      return {
        success: true,
        totalTicketsUpdated: 0,
        results: []
      };
    }
    
    let totalTicketsUpdated = 0;
    const results = [];
    
    // Process each completed event
    for (const event of events) {
      // Check if event is actually completed (considering time)
      const eventDateTime = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        eventDateTime.setHours(hours, minutes, 0, 0);
      } else {
        // If no time provided, assume end of day
        eventDateTime.setHours(23, 59, 59, 999);
      }
      
      // Add 4 hours to consider event "completed" after reasonable duration
      const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000));
      
      if (now > eventEndTime) {
        console.log(`Processing completed event: ${event.id}`);
        const success = await markTicketsAsAttended(event.id);
        
        if (success) {
          // First get all bookings for this event
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id')
            .eq('event_id', event.id);
            
          if (bookingsError) {
            console.error("Error fetching bookings for attendance update:", bookingsError);
            continue;
          }
          
          // Then get tickets for these bookings
          const bookingIds = bookings?.map(booking => booking.id) || [];
          
          if (bookingIds.length === 0) {
            continue;
          }
          
          // Get the count of tickets that were updated
          const { data: updatedTickets } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('event_id', event.id)
            .eq('status', 'present');
          
          const ticketsUpdated = updatedTickets?.length || 0;
          totalTicketsUpdated += ticketsUpdated;
          
          results.push({
            eventId: event.id,
            success: true,
            ticketsUpdated
          });
        } else {
          results.push({
            eventId: event.id,
            success: false,
            error: 'Failed to mark tickets as attended'
          });
        }
      }
    }
    
    console.log(`Direct processing completed. Total tickets updated: ${totalTicketsUpdated}`);
    return {
      success: true,
      totalTicketsUpdated,
      results
    };
  } catch (err) {
    console.error('Error in processCompletedEventsDirect:', err);
    return {
      success: false,
      totalTicketsUpdated: 0,
      results: []
    };
  }
};

// Function to get all bookings for admin dashboard
export const getAllBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      event:event_id (*)
    `)
    .order('booking_date', { ascending: false });
    
  if (error) {
    console.error("Error fetching all bookings:", error);
    throw error;
  }
  
  return data || [];
};

// Function to check if attendance fields exist in the database
export const checkAttendanceFields = async (): Promise<boolean> => {
  try {
    // Try to select the attended field from tickets table
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking attendance fields:', error);
      return false;
    }
    
    console.log('Attendance fields check result:', data);
    return true;
  } catch (err) {
    console.error('Error in checkAttendanceFields:', err);
    return false;
  }
};
