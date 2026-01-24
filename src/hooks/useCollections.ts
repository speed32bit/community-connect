import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type CollectionActionType = 'reminder_email' | 'phone_call' | 'formal_notice' | 'legal_action' | 'payment_plan' | 'other';

export interface CollectionAction {
  id: string;
  hoa_id: string;
  unit_id: string;
  action_type: CollectionActionType;
  scheduled_date: string | null;
  completed_date: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  unit?: {
    id: string;
    unit_number: string;
    address: string | null;
  };
}

export interface DelinquentUnit {
  id: string;
  unit_number: string;
  address: string | null;
  balance_due: number;
  days_past_due: number;
  owner_name: string | null;
  last_action?: CollectionAction | null;
}

export function useDelinquentUnits() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['delinquent_units', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      // Get units with outstanding invoices
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          unit:units(id, unit_number, address),
          payments(amount)
        `)
        .eq('hoa_id', hoa.id)
        .in('status', ['pending', 'partial', 'overdue'])
        .lt('due_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      // Group by unit and calculate totals
      const unitMap = new Map<string, DelinquentUnit>();

      invoices?.forEach((invoice) => {
        if (!invoice.unit) return;

        const totalPaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const remaining = Number(invoice.amount) - totalPaid + Number(invoice.late_fee || 0) - Number(invoice.discount || 0);
        
        if (remaining <= 0) return;

        const daysPastDue = Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));

        const existing = unitMap.get(invoice.unit.id);

        if (existing) {
          existing.balance_due += remaining;
          existing.days_past_due = Math.max(existing.days_past_due, daysPastDue);
        } else {
          unitMap.set(invoice.unit.id, {
            id: invoice.unit.id,
            unit_number: invoice.unit.unit_number,
            address: invoice.unit.address,
            balance_due: remaining,
            days_past_due: daysPastDue,
            owner_name: null,
          });
        }
      });

      return Array.from(unitMap.values()).sort((a, b) => b.balance_due - a.balance_due);
    },
    enabled: !!hoa?.id,
  });
}

export function useCollectionActions(unitId?: string) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['collection_actions', hoa?.id, unitId],
    queryFn: async () => {
      if (!hoa?.id) return [];

      let query = supabase
        .from('collection_actions')
        .select(`
          *,
          unit:units(id, unit_number, address)
        `)
        .eq('hoa_id', hoa.id)
        .order('created_at', { ascending: false });

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CollectionAction[];
    },
    enabled: !!hoa?.id,
  });
}

interface CreateCollectionActionData {
  unit_id: string;
  action_type: CollectionActionType;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
}

export function useCreateCollectionAction() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCollectionActionData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { error } = await supabase.from('collection_actions').insert({
        unit_id: data.unit_id,
        action_type: data.action_type,
        scheduled_date: data.scheduled_date,
        completed_date: data.completed_date,
        notes: data.notes,
        hoa_id: hoa.id,
        performed_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection_actions'] });
      queryClient.invalidateQueries({ queryKey: ['delinquent_units'] });
      toast({ title: 'Collection action recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to record action', description: error.message, variant: 'destructive' });
    },
  });
}
