import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  calculateUnitAssessments,
  calculateAssessmentByCategory,
  type UnitAssessment,
  type BudgetLineItem,
} from '@/lib/assessment-calculations';

export interface BudgetAssignment {
  id: string;
  budget_id: string;
  common_area_percentage: number;
  auto_invoice_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get common area percentage for a budget (for assessment calculations)
 */
export function useBudgetAssignment(budgetId: string | null) {
  return useQuery({
    queryKey: ['budget_assignment', budgetId],
    queryFn: async () => {
      if (!budgetId) return null;

      const { data, error } = await supabase
        .from('budget_assignments')
        .select('*')
        .eq('budget_id', budgetId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BudgetAssignment | null;
    },
    enabled: !!budgetId,
  });
}

interface CreateAssignmentData {
  budget_id: string;
  common_area_percentage: number;
  auto_invoice_enabled?: boolean;
}

export function useCreateBudgetAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAssignmentData) => {
      const { error } = await supabase
        .from('budget_assignments')
        .insert({
          ...data,
          auto_invoice_enabled: data.auto_invoice_enabled ?? false,
        });

      if (error) throw error;
      return data.budget_id;
    },
    onSuccess: (budgetId) => {
      queryClient.invalidateQueries({ queryKey: ['budget_assignment', budgetId] });
      toast({ title: 'Assessment settings saved' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save assessment settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

interface UpdateAssignmentData {
  budget_id: string;
  common_area_percentage?: number;
  auto_invoice_enabled?: boolean;
}

export function useUpdateBudgetAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ budget_id, ...data }: UpdateAssignmentData) => {
      const { error } = await supabase
        .from('budget_assignments')
        .update(data)
        .eq('budget_id', budget_id);

      if (error) throw error;
      return budget_id;
    },
    onSuccess: (budgetId) => {
      queryClient.invalidateQueries({ queryKey: ['budget_assignment', budgetId] });
      toast({ title: 'Assessment settings updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update assessment settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Calculate assessments for all units in an HOA based on a budget
 */
export function useCalculateAssessments(budgetId: string | null) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['assessments', budgetId, hoa?.id],
    queryFn: async () => {
      if (!budgetId || !hoa?.id) return null;

      // Get budget details
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('total_amount')
        .eq('id', budgetId)
        .single();

      if (budgetError) throw budgetError;

      // Get all units with square footage
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, unit_number, square_feet')
        .eq('hoa_id', hoa.id);

      if (unitsError) throw unitsError;

      // Get budget assignment (common area %)
      const { data: assignment } = await supabase
        .from('budget_assignments')
        .select('common_area_percentage')
        .eq('budget_id', budgetId)
        .single();

      const commonAreaPercentage = assignment?.common_area_percentage || 45;
      const totalSquareFeet = (units || []).reduce(
        (sum, u) => sum + (Number(u.square_feet) || 0),
        0
      );

      const assessments = calculateUnitAssessments({
        budgetTotal: Number(budget?.total_amount) || 0,
        units: (units || []).map((u) => ({
          id: u.id,
          unitNumber: u.unit_number,
          squareFeet: Number(u.square_feet) || 0,
        })),
        totalSquareFeet: totalSquareFeet || 1, // Prevent division by zero
        commonAreaPercentage,
      });

      return assessments;
    },
    enabled: !!budgetId && !!hoa?.id,
  });
}

/**
 * Get assessment breakdown by budget category
 */
export function useAssessmentsByCategory(budgetId: string | null) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['assessments_by_category', budgetId, hoa?.id],
    queryFn: async () => {
      if (!budgetId || !hoa?.id) return null;

      // Get budget lines
      const { data: lines, error: linesError } = await supabase
        .from('budget_lines')
        .select('id, category_name, annual_total')
        .eq('budget_id', budgetId);

      if (linesError) throw linesError;

      // Get all units
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, unit_number, square_feet')
        .eq('hoa_id', hoa.id);

      if (unitsError) throw unitsError;

      // Get budget assignment
      const { data: assignment } = await supabase
        .from('budget_assignments')
        .select('common_area_percentage')
        .eq('budget_id', budgetId)
        .single();

      const commonAreaPercentage = assignment?.common_area_percentage || 45;
      const totalSquareFeet = (units || []).reduce(
        (sum, u) => sum + (Number(u.square_feet) || 0),
        0
      );

      return calculateAssessmentByCategory(
        (lines || []).map((l: any) => ({
          id: l.id,
          category_name: l.category_name,
          annual_total: Number(l.annual_total) || 0,
        })),
        (units || []).map((u: any) => ({
          id: u.id,
          unitNumber: u.unit_number,
          squareFeet: Number(u.square_feet) || 0,
        })),
        totalSquareFeet || 1,
        commonAreaPercentage
      );
    },
    enabled: !!budgetId && !!hoa?.id,
  });
}

interface GenerateInvoicesData {
  budget_id: string;
  due_date: string;
  description?: string;
  send_immediately?: boolean;
}

/**
 * Generate invoices for all units based on budget assessments
 */
export function useGenerateInvoicesFromBudget() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: GenerateInvoicesData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      // Get budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', data.budget_id)
        .single();

      if (budgetError) throw budgetError;

      // Get assessments
      const { data: units } = await supabase
        .from('units')
        .select('id, unit_number, square_feet')
        .eq('hoa_id', hoa.id);

      const { data: assignment } = await supabase
        .from('budget_assignments')
        .select('common_area_percentage')
        .eq('budget_id', data.budget_id)
        .single();

      const totalSquareFeet = (units || []).reduce(
        (sum, u) => sum + (Number(u.square_feet) || 0),
        0
      );

      const commonAreaPercentage = assignment?.common_area_percentage || 45;

      const assessments = calculateUnitAssessments({
        budgetTotal: Number(budget.total_amount) || 0,
        units: (units || []).map((u: any) => ({
          id: u.id,
          unitNumber: u.unit_number,
          squareFeet: Number(u.square_feet) || 0,
        })),
        totalSquareFeet: totalSquareFeet || 1,
        commonAreaPercentage,
      });

      // Create invoices for each unit
      const invoicesData = assessments.map((assessment) => ({
        hoa_id: hoa.id,
        unit_id: assessment.unitId,
        invoice_number: `INV-${budget.fiscal_year}-${assessment.unitNumber}`,
        title: `${budget.name} - Assessment`,
        description:
          data.description ||
          `Fiscal Year ${budget.fiscal_year} assessment for unit ${assessment.unitNumber}`,
        amount: assessment.annualAssessment,
        discount: 0,
        late_fee: 0,
        status: 'pending' as const,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: data.due_date,
        is_recurring: false,
        created_by: user?.id,
      }));

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoicesData);

      if (invoiceError) throw invoiceError;

      return {
        count: assessments.length,
        totalAmount: assessments.reduce((sum, a) => sum + a.annualAssessment, 0),
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoices generated successfully',
        description: `Created ${result.count} invoices totaling ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(result.totalAmount)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate invoices',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
