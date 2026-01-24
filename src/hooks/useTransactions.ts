import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionType } from '@/types/database';

export interface TransactionWithCategory {
  id: string;
  hoa_id: string;
  transaction_date: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  created_by: string | null;
  category?: {
    id: string;
    name: string;
    type: TransactionType;
  } | null;
}

export function useTransactions() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['transactions', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:transaction_categories(id, name, type)
        `)
        .eq('hoa_id', hoa.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as TransactionWithCategory[];
    },
    enabled: !!hoa?.id,
  });
}

export function useTransactionCategories() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['transaction_categories', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('hoa_id', hoa.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!hoa?.id,
  });
}

interface CreateTransactionData {
  transaction_date: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id?: string;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { error } = await supabase.from('transactions').insert({
        ...data,
        hoa_id: hoa.id,
        created_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Transaction recorded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to record transaction', description: error.message, variant: 'destructive' });
    },
  });
}
