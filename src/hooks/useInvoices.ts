import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, InvoiceWithDetails, InvoiceStatus, DuesFrequency } from '@/types/database';
import { toast } from 'sonner';

export function useInvoices(options?: { status?: InvoiceStatus | 'outstanding' | 'all' | 'deleted' }) {
  const { hoa } = useAuth();
  const status = options?.status || 'outstanding';

  return useQuery({
    queryKey: ['invoices', hoa?.id, status],
    queryFn: async () => {
      if (!hoa?.id) return [];

      let query = supabase
        .from('invoices')
        .select(`
          *,
          unit:units!invoices_unit_id_fkey(id, unit_number, address),
          category:invoice_categories!invoices_category_id_fkey(id, name),
          deposit_account:deposit_accounts!invoices_deposit_account_id_fkey(id, name),
          payments(id, amount, payment_date, payment_method)
        `)
        .eq('hoa_id', hoa.id)
        .order('created_at', { ascending: false });

      // Apply filters based on status
      if (status === 'outstanding') {
        query = query.in('status', ['pending', 'partial', 'overdue']).is('deleted_at', null);
      } else if (status === 'deleted') {
        query = query.not('deleted_at', 'is', null);
      } else if (status === 'all') {
        query = query.is('deleted_at', null);
      } else {
        query = query.eq('status', status).is('deleted_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate remaining balance for each invoice
      return (data || []).map((invoice: any) => {
        const totalPaid = (invoice.payments || []).reduce(
          (sum: number, p: any) => sum + parseFloat(String(p.amount || 0)),
          0
        );
        const totalDue = parseFloat(String(invoice.amount || 0)) - parseFloat(String(invoice.discount || 0)) + parseFloat(String(invoice.late_fee || 0));
        
        return {
          ...invoice,
          remaining_balance: totalDue - totalPaid,
          owner_name: invoice.unit?.unit_number || 'Unknown',
        } as InvoiceWithDetails;
      });
    },
    enabled: !!hoa?.id,
  });
}

export function useInvoice(invoiceId: string | null) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId || !hoa?.id) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          unit:units!invoices_unit_id_fkey(id, unit_number, address),
          category:invoice_categories!invoices_category_id_fkey(id, name),
          deposit_account:deposit_accounts!invoices_deposit_account_id_fkey(id, name),
          payments(id, amount, payment_date, payment_method, reference_number, notes),
          line_items:invoice_line_items(id, description, amount, quantity)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      const totalPaid = (data.payments || []).reduce(
        (sum: number, p: any) => sum + parseFloat(String(p.amount || 0)),
        0
      );
      const totalDue = parseFloat(String(data.amount || 0)) - parseFloat(String(data.discount || 0)) + parseFloat(String(data.late_fee || 0));

      return {
        ...data,
        remaining_balance: totalDue - totalPaid,
        owner_name: data.unit?.unit_number || 'Unknown',
      } as InvoiceWithDetails;
    },
    enabled: !!invoiceId && !!hoa?.id,
  });
}

interface CreateInvoiceData {
  unit_id: string;
  title: string;
  description?: string;
  category_id?: string;
  amount: number;
  due_date: string;
  is_recurring?: boolean;
  recurring_frequency?: DuesFrequency;
  deposit_account_id?: string;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      if (!hoa?.id || !user?.id) throw new Error('Not authenticated');

      // Generate invoice number
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', {
        _hoa_id: hoa.id,
      });

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          ...data,
          hoa_id: hoa.id,
          invoice_number: invoiceNumber,
          created_by: user.id,
          issue_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create invoice: ' + error.message);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invoice> & { id: string }) => {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return invoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      toast.success('Invoice updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update invoice: ' + error.message);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'deleted' as InvoiceStatus
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete invoice: ' + error.message);
    },
  });
}
