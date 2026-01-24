import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  hoa_id: string;
  name: string;
  fiscal_year: number;
  total_amount: number | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  category_id: string | null;
  category_name: string;
  january: number | null;
  february: number | null;
  march: number | null;
  april: number | null;
  may: number | null;
  june: number | null;
  july: number | null;
  august: number | null;
  september: number | null;
  october: number | null;
  november: number | null;
  december: number | null;
  annual_total: number | null;
  created_at: string;
}

export function useBudgets() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['budgets', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('hoa_id', hoa.id)
        .order('fiscal_year', { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!hoa?.id,
  });
}

export function useBudget(budgetId: string | null) {
  return useQuery({
    queryKey: ['budget', budgetId],
    queryFn: async () => {
      if (!budgetId) return null;

      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          lines:budget_lines(*)
        `)
        .eq('id', budgetId)
        .single();

      if (error) throw error;
      return data as Budget & { lines: BudgetLine[] };
    },
    enabled: !!budgetId,
  });
}

interface CreateBudgetData {
  name: string;
  fiscal_year: number;
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { error } = await supabase.from('budgets').insert({
        ...data,
        hoa_id: hoa.id,
        created_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create budget', description: error.message, variant: 'destructive' });
    },
  });
}
