import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SeedDataResult {
  units: number;
  invoices: number;
  payments: number;
}

export function useSeedDemoData() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<SeedDataResult> => {
      if (!hoa?.id || !user?.id) throw new Error('Not authenticated');

      const demoUnits = [
        { unit_number: '101', address: '123 Oak Street, Apt 101', floor: 1, bedrooms: 2, bathrooms: 1, square_feet: 950 },
        { unit_number: '102', address: '123 Oak Street, Apt 102', floor: 1, bedrooms: 1, bathrooms: 1, square_feet: 750 },
        { unit_number: '201', address: '123 Oak Street, Apt 201', floor: 2, bedrooms: 3, bathrooms: 2, square_feet: 1200 },
        { unit_number: '202', address: '123 Oak Street, Apt 202', floor: 2, bedrooms: 2, bathrooms: 2, square_feet: 1050 },
        { unit_number: '301', address: '123 Oak Street, Apt 301', floor: 3, bedrooms: 2, bathrooms: 1.5, square_feet: 1000 },
      ];

      // Create units
      const { data: createdUnits, error: unitsError } = await supabase
        .from('units')
        .insert(demoUnits.map(u => ({ ...u, hoa_id: hoa.id })))
        .select();

      if (unitsError) throw unitsError;

      // Create invoices for each unit
      const invoices = [];
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const twoMonthsAgo = new Date(today);
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      for (const unit of createdUnits || []) {
        // Current month dues (pending)
        invoices.push({
          hoa_id: hoa.id,
          unit_id: unit.id,
          invoice_number: `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${unit.unit_number}`,
          title: `Monthly Dues - ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          amount: 350,
          issue_date: today.toISOString().split('T')[0],
          due_date: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
          status: 'pending',
          created_by: user.id,
        });

        // Last month dues (mix of paid and partial)
        const lastMonthStatus = Math.random() > 0.3 ? 'paid' : (Math.random() > 0.5 ? 'partial' : 'overdue');
        invoices.push({
          hoa_id: hoa.id,
          unit_id: unit.id,
          invoice_number: `INV-${monthAgo.getFullYear()}${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${unit.unit_number}`,
          title: `Monthly Dues - ${monthAgo.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          amount: 350,
          issue_date: monthAgo.toISOString().split('T')[0],
          due_date: new Date(monthAgo.getFullYear(), monthAgo.getMonth() + 1, 1).toISOString().split('T')[0],
          status: lastMonthStatus,
          created_by: user.id,
        });

        // Two months ago (all paid)
        invoices.push({
          hoa_id: hoa.id,
          unit_id: unit.id,
          invoice_number: `INV-${twoMonthsAgo.getFullYear()}${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}-${unit.unit_number}`,
          title: `Monthly Dues - ${twoMonthsAgo.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          amount: 350,
          issue_date: twoMonthsAgo.toISOString().split('T')[0],
          due_date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 1).toISOString().split('T')[0],
          status: 'paid',
          created_by: user.id,
        });
      }

      const { data: createdInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .insert(invoices)
        .select();

      if (invoicesError) throw invoicesError;

      // Create payments for paid and partial invoices
      const payments = [];
      const paymentMethods = ['check', 'ach', 'credit_card', 'cash'] as const;

      for (const invoice of createdInvoices || []) {
        if (invoice.status === 'paid') {
          payments.push({
            hoa_id: hoa.id,
            unit_id: invoice.unit_id,
            invoice_id: invoice.id,
            amount: invoice.amount,
            payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            payment_date: invoice.due_date,
            recorded_by: user.id,
            reference_number: `CHK${Math.floor(Math.random() * 9000) + 1000}`,
          });
        } else if (invoice.status === 'partial') {
          payments.push({
            hoa_id: hoa.id,
            unit_id: invoice.unit_id,
            invoice_id: invoice.id,
            amount: Math.floor(invoice.amount * 0.5),
            payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            payment_date: invoice.due_date,
            recorded_by: user.id,
            reference_number: `CHK${Math.floor(Math.random() * 9000) + 1000}`,
          });
        }
      }

      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(payments);

      if (paymentsError) throw paymentsError;

      // Create some transactions
      const transactions: { description: string; amount: number; type: 'expense' | 'income'; transaction_date: string }[] = [
        { description: 'Landscaping Service - January', amount: 1500, type: 'expense', transaction_date: monthAgo.toISOString().split('T')[0] },
        { description: 'Insurance Premium - Q1', amount: 2400, type: 'expense', transaction_date: twoMonthsAgo.toISOString().split('T')[0] },
        { description: 'Pool Maintenance', amount: 450, type: 'expense', transaction_date: today.toISOString().split('T')[0] },
        { description: 'Common Area Utilities', amount: 890, type: 'expense', transaction_date: monthAgo.toISOString().split('T')[0] },
      ];

      await supabase.from('transactions').insert(
        transactions.map(t => ({ ...t, hoa_id: hoa.id, created_by: user.id }))
      );

      // Create an announcement
      await supabase.from('announcements').insert({
        hoa_id: hoa.id,
        title: 'Welcome to the Community!',
        content: 'Welcome to our homeowners association management portal. Here you can view your invoices, make payments, and stay updated on community announcements.\n\nPlease reach out if you have any questions about your account.',
        is_pinned: true,
        publish_date: today.toISOString(),
        created_by: user.id,
      });

      return {
        units: createdUnits?.length || 0,
        invoices: createdInvoices?.length || 0,
        payments: payments.length,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast({ 
        title: 'Demo data created!', 
        description: `Created ${data.units} units, ${data.invoices} invoices, and ${data.payments} payments.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create demo data', description: error.message, variant: 'destructive' });
    },
  });
}
