import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  name: string;
  email: string | null;
  role: 'audience' | 'artist' | 'organizer';
  avatar_url: string | null;
  content: string;
  rating: number;
  is_approved: boolean;
  is_featured: boolean;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTestimonialInput {
  name: string;
  email?: string;
  role: 'audience' | 'artist' | 'organizer';
  avatar_url?: string;
  content: string;
  rating: number;
  event_id?: string;
}

export interface UpdateTestimonialInput {
  name?: string;
  email?: string;
  role?: 'audience' | 'artist' | 'organizer';
  avatar_url?: string;
  content?: string;
  rating?: number;
  is_approved?: boolean;
  is_featured?: boolean;
  event_id?: string;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }
  
  return (data as unknown as Testimonial[]) || [];
};

export const getAllTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching all testimonials:", error);
    return [];
  }
  
  return (data as unknown as Testimonial[]) || [];
};

export const getPendingTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching pending testimonials:", error);
    return [];
  }
  
  return (data as unknown as Testimonial[]) || [];
};

export const createTestimonial = async (testimonialData: CreateTestimonialInput): Promise<Testimonial> => {
  const { data, error } = await supabase
    .from('testimonials')
    .insert(testimonialData)
    .select('*')
    .single();

  if (error) {
    console.error("Error creating testimonial:", error);
    throw new Error(error.message);
  }

  return data as unknown as Testimonial;
};

export const updateTestimonial = async (id: string, testimonialData: UpdateTestimonialInput): Promise<Testimonial> => {
  const { data, error } = await supabase
    .from('testimonials')
    .update(testimonialData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Error updating testimonial:", error);
    throw new Error(error.message);
  }

  return data as unknown as Testimonial;
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting testimonial:", error);
    throw new Error(error.message);
  }
};

export const approveTestimonial = async (id: string): Promise<Testimonial> => {
  return updateTestimonial(id, { is_approved: true });
};

export const rejectTestimonial = async (id: string): Promise<void> => {
  await deleteTestimonial(id);
};

export const getTestimonial = async (id: string): Promise<Testimonial | null> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching testimonial:", error);
    return null;
  }

  return data as unknown as Testimonial;
};

export const getTestimonialsByRole = async (role: 'audience' | 'artist' | 'organizer'): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('role', role)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching testimonials by role:", error);
    return [];
  }
  
  return (data as unknown as Testimonial[]) || [];
}; 