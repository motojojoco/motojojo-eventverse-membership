import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  icon: string;
  color: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    throw error;
  }

  return data;
};

// Get category by name
export const getCategoryByName = async (name: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    console.error('Error fetching category by name:', error);
    throw error;
  }

  return data;
};

// Create new category
export const createCategory = async (categoryData: CreateCategoryData): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data;
};

// Update category
export const updateCategory = async (id: string, categoryData: UpdateCategoryData): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  return data;
};

// Delete category (soft delete by setting is_active to false)
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Hard delete category
export const hardDeleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting category:', error);
    throw error;
  }
};

// Subscribe to real-time category changes
export const subscribeToCategories = (
  callback: (payload: any) => void
): RealtimeChannel => {
  return supabase
    .channel('categories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories'
      },
      callback
    )
    .subscribe();
};

// Get categories with event counts
export const getCategoriesWithEventCounts = async (): Promise<(Category & { event_count: number })[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      events:events(count)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories with event counts:', error);
    throw error;
  }

  return (data || []).map((category: any) => ({
    ...category,
    event_count: category.events?.[0]?.count || 0
  }));
}; 