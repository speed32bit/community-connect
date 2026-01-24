import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  hoa_id: string;
  title: string;
  content: string;
  visibility: string | null;
  is_pinned: boolean | null;
  publish_date: string | null;
  expire_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useAnnouncements() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['announcements', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('hoa_id', hoa.id)
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!hoa?.id,
  });
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  visibility?: string;
  is_pinned?: boolean;
  publish_date?: string;
  expire_date?: string;
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { error } = await supabase.from('announcements').insert({
        ...data,
        hoa_id: hoa.id,
        created_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement published' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to publish announcement', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete announcement', description: error.message, variant: 'destructive' });
    },
  });
}
