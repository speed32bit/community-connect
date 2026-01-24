import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DuesFrequency } from '@/types/database';

interface UpdateHOAData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  dues_amount?: number;
  dues_frequency?: DuesFrequency;
  late_fee_amount?: number;
  late_fee_percentage?: number;
  grace_period_days?: number;
}

export function useUpdateHOA() {
  const queryClient = useQueryClient();
  const { hoa, refreshProfile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateHOAData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { error } = await supabase
        .from('hoas')
        .update(data)
        .eq('id', hoa.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['hoa'] });
      toast({ title: 'Settings saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
    },
  });
}
