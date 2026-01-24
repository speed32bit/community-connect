import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Unit, UnitWithMembers, Profile } from '@/types/database';
import { toast } from 'sonner';

export function useUnits() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['units', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data: units, error } = await supabase
        .from('units')
        .select('*')
        .eq('hoa_id', hoa.id)
        .order('unit_number');

      if (error) throw error;

      // Get unit members separately
      const unitIds = (units || []).map(u => u.id);
      
      const { data: members } = await supabase
        .from('unit_members')
        .select('*')
        .in('unit_id', unitIds);

      // Get profiles for members
      const userIds = [...new Set((members || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      // Calculate balance due for each unit
      const unitsWithBalance = await Promise.all(
        (units || []).map(async (unit) => {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('amount, discount, late_fee, payments(amount)')
            .eq('unit_id', unit.id)
            .in('status', ['pending', 'partial', 'overdue'])
            .is('deleted_at', null);

          const balanceDue = (invoices || []).reduce((total, inv) => {
            const invoiceTotal = parseFloat(String(inv.amount)) - 
                                parseFloat(String(inv.discount || 0)) + 
                                parseFloat(String(inv.late_fee || 0));
            const paid = (inv.payments || []).reduce(
              (sum: number, p: any) => sum + parseFloat(String(p.amount)),
              0
            );
            return total + (invoiceTotal - paid);
          }, 0);

          const unitMembers = (members || [])
            .filter(m => m.unit_id === unit.id)
            .map(m => ({
              ...m,
              profile: (profiles || []).find(p => p.user_id === m.user_id),
            }));

          return {
            ...unit,
            balance_due: balanceDue,
            unit_members: unitMembers,
          } as UnitWithMembers;
        })
      );

      return unitsWithBalance;
    },
    enabled: !!hoa?.id,
  });
}

export function useUnit(unitId: string | null) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      if (!unitId || !hoa?.id) return null;

      const { data: unit, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

      if (error) throw error;

      // Get unit members
      const { data: members } = await supabase
        .from('unit_members')
        .select('*')
        .eq('unit_id', unitId);

      // Get profiles for members
      const userIds = (members || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      // Get invoices and payments for ledger
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, payments(*)')
        .eq('unit_id', unitId)
        .is('deleted_at', null)
        .order('issue_date', { ascending: false });

      const balanceDue = (invoices || []).reduce((total, inv) => {
        if (!['pending', 'partial', 'overdue'].includes(inv.status)) return total;
        const invoiceTotal = parseFloat(String(inv.amount)) - 
                            parseFloat(String(inv.discount || 0)) + 
                            parseFloat(String(inv.late_fee || 0));
        const paid = (inv.payments || []).reduce(
          (sum: number, p: any) => sum + parseFloat(String(p.amount)),
          0
        );
        return total + (invoiceTotal - paid);
      }, 0);

      const unitMembers = (members || []).map(m => ({
        ...m,
        profile: (profiles || []).find(p => p.user_id === m.user_id),
      }));

      return {
        ...unit,
        balance_due: balanceDue,
        unit_members: unitMembers,
        invoices,
      } as UnitWithMembers & { invoices: any[] };
    },
    enabled: !!unitId && !!hoa?.id,
  });
}

interface CreateUnitData {
  unit_number: string;
  address?: string;
  building?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  parking_spaces?: number;
  notes?: string;
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  const { hoa } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateUnitData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { data: unit, error } = await supabase
        .from('units')
        .insert({
          ...data,
          hoa_id: hoa.id,
        })
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create unit: ' + error.message);
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Unit> & { id: string }) => {
      const { data: unit, error } = await supabase
        .from('units')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', variables.id] });
      toast.success('Unit updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update unit: ' + error.message);
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitId: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete unit: ' + error.message);
    },
  });
}
