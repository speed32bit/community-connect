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
        .select('*')
        .eq('id', budgetId)
        .single();

      if (error) throw error;
      return data as Budget;
    },
    enabled: !!budgetId,
  });
}

export function useBudgetLines(budgetId: string | null) {
  return useQuery({
    queryKey: ['budget_lines', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];

      const { data, error } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('budget_id', budgetId)
        .order('category_name');

      if (error) throw error;
      return data as BudgetLine[];
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

interface UpdateBudgetData {
  id: string;
  name?: string;
  fiscal_year?: number;
  is_active?: boolean;
  total_amount?: number;
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateBudgetData) => {
      const { error } = await supabase
        .from('budgets')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast({ title: 'Budget updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update budget', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete budget lines first
      await supabase.from('budget_lines').delete().eq('budget_id', id);
      
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete budget', description: error.message, variant: 'destructive' });
    },
  });
}

interface CreateBudgetLineData {
  budget_id: string;
  category_name: string;
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
}

export function useCreateBudgetLine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBudgetLineData) => {
      // Don't include annual_total - it's a computed column
      const { error } = await supabase.from('budget_lines').insert(data);
      if (error) throw error;

      // Update budget total
      await updateBudgetTotal(data.budget_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Line item added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add line item', description: error.message, variant: 'destructive' });
    },
  });
}

interface UpdateBudgetLineData {
  id: string;
  category_name?: string;
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateBudgetLineData) => {
      // Get the budget_id first
      const { data: line } = await supabase
        .from('budget_lines')
        .select('budget_id')
        .eq('id', id)
        .single();

      // Don't include annual_total - it's a computed column
      const { error } = await supabase
        .from('budget_lines')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Update budget total
      if (line?.budget_id) {
        await updateBudgetTotal(line.budget_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Line item updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update line item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBudgetLine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get the budget_id first
      const { data: line } = await supabase
        .from('budget_lines')
        .select('budget_id')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('budget_lines').delete().eq('id', id);
      if (error) throw error;

      // Update budget total
      if (line?.budget_id) {
        await updateBudgetTotal(line.budget_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Line item deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete line item', description: error.message, variant: 'destructive' });
    },
  });
}

async function updateBudgetTotal(budgetId: string) {
  const { data: lines } = await supabase
    .from('budget_lines')
    .select('annual_total')
    .eq('budget_id', budgetId);

  const total = (lines || []).reduce((sum, line) => sum + (Number(line.annual_total) || 0), 0);

  await supabase
    .from('budgets')
    .update({ total_amount: total })
    .eq('id', budgetId);
}
