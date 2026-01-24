import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Payment, PaymentWithDetails, PaymentMethod } from '@/types/database';
import { toast } from 'sonner';

export function usePayments() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['payments', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices!payments_invoice_id_fkey(id, invoice_number, title, amount),
          unit:units!payments_unit_id_fkey(id, unit_number, address)
        `)
        .eq('hoa_id', hoa.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as PaymentWithDetails[];
    },
    enabled: !!hoa?.id,
  });
}

interface RecordPaymentData {
  invoice_id: string;
  unit_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();

  return useMutation({
    mutationFn: async (data: RecordPaymentData) => {
      if (!hoa?.id || !user?.id) throw new Error('Not authenticated');

      // Record the payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          ...data,
          hoa_id: hoa.id,
          recorded_by: user.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Get the invoice to check remaining balance
      const { data: invoice } = await supabase
        .from('invoices')
        .select('amount, discount, late_fee')
        .eq('id', data.invoice_id)
        .single();

      if (invoice) {
        // Get total payments for this invoice
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', data.invoice_id);

        const totalPaid = (payments || []).reduce(
          (sum, p) => sum + parseFloat(String(p.amount)),
          0
        );
        const totalDue = parseFloat(String(invoice.amount)) - 
                         parseFloat(String(invoice.discount || 0)) + 
                         parseFloat(String(invoice.late_fee || 0));

        // Update invoice status
        let newStatus: 'paid' | 'partial' = 'partial';
        if (totalPaid >= totalDue) {
          newStatus = 'paid';
        }

        await supabase
          .from('invoices')
          .update({ status: newStatus })
          .eq('id', data.invoice_id);
      }

      // Record transaction
      await supabase.from('transactions').insert({
        hoa_id: hoa.id,
        description: `Payment received for invoice`,
        amount: data.amount,
        type: 'income',
        transaction_date: data.payment_date,
        reference_id: payment.id,
        reference_type: 'payment',
        created_by: user.id,
      });

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record payment: ' + error.message);
    },
  });
}
