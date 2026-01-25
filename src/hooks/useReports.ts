import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO } from 'date-fns';

export interface AgingReportRow {
  unit_number: string;
  owner_name: string;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_due: number;
}

export function useAgingReport() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['reports', 'aging', hoa?.id],
    queryFn: async (): Promise<AgingReportRow[]> => {
      if (!hoa?.id) return [];

      // Get all units with their outstanding invoices
      const { data: units } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          unit_members(
            user_id,
            is_primary,
            profiles:profiles(first_name, last_name)
          )
        `)
        .eq('hoa_id', hoa.id)
        .eq('status', 'active');

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, unit_id, amount, discount, late_fee, due_date, status, payments(amount)')
        .eq('hoa_id', hoa.id)
        .in('status', ['pending', 'partial', 'overdue'])
        .is('deleted_at', null);

      const today = new Date();
      const reportData: AgingReportRow[] = [];

      (units || []).forEach((unit: any) => {
        const unitInvoices = (invoices || []).filter(inv => inv.unit_id === unit.id);
        
        let current = 0;
        let days_1_30 = 0;
        let days_31_60 = 0;
        let days_61_90 = 0;
        let days_90_plus = 0;

        unitInvoices.forEach((inv: any) => {
          const totalDue = parseFloat(String(inv.amount)) - 
                          parseFloat(String(inv.discount || 0)) + 
                          parseFloat(String(inv.late_fee || 0));
          const paid = (inv.payments || []).reduce(
            (sum: number, p: any) => sum + parseFloat(String(p.amount)),
            0
          );
          const remaining = totalDue - paid;

          if (remaining > 0) {
            const dueDate = parseISO(inv.due_date);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysOverdue <= 0) current += remaining;
            else if (daysOverdue <= 30) days_1_30 += remaining;
            else if (daysOverdue <= 60) days_31_60 += remaining;
            else if (daysOverdue <= 90) days_61_90 += remaining;
            else days_90_plus += remaining;
          }
        });

        const total_due = current + days_1_30 + days_31_60 + days_61_90 + days_90_plus;
        
        if (total_due > 0) {
          const primaryMember = unit.unit_members?.find((m: any) => m.is_primary);
          const ownerName = primaryMember?.profiles 
            ? `${primaryMember.profiles.first_name || ''} ${primaryMember.profiles.last_name || ''}`.trim()
            : '-';

          reportData.push({
            unit_number: unit.unit_number,
            owner_name: ownerName,
            current,
            days_1_30,
            days_31_60,
            days_61_90,
            days_90_plus,
            total_due,
          });
        }
      });

      return reportData.sort((a, b) => b.total_due - a.total_due);
    },
    enabled: !!hoa?.id,
  });
}

export interface CollectionReportRow {
  month: string;
  check: number;
  ach: number;
  credit_card: number;
  cash: number;
  other: number;
  total: number;
}

export function useCollectionReport() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['reports', 'collection', hoa?.id],
    queryFn: async (): Promise<CollectionReportRow[]> => {
      if (!hoa?.id) return [];

      const { data: payments } = await supabase
        .from('payments')
        .select('payment_date, payment_method, amount')
        .eq('hoa_id', hoa.id)
        .order('payment_date', { ascending: false });

      // Group by month
      const monthlyData: Record<string, CollectionReportRow> = {};

      (payments || []).forEach((p: any) => {
        const date = new Date(p.payment_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthLabel,
            check: 0,
            ach: 0,
            credit_card: 0,
            cash: 0,
            other: 0,
            total: 0,
          };
        }

        const amount = parseFloat(String(p.amount));
        monthlyData[monthKey].total += amount;

        switch (p.payment_method) {
          case 'check':
            monthlyData[monthKey].check += amount;
            break;
          case 'ach':
            monthlyData[monthKey].ach += amount;
            break;
          case 'credit_card':
            monthlyData[monthKey].credit_card += amount;
            break;
          case 'cash':
            monthlyData[monthKey].cash += amount;
            break;
          default:
            monthlyData[monthKey].other += amount;
        }
      });

      return Object.values(monthlyData);
    },
    enabled: !!hoa?.id,
  });
}

export interface DelinquencyReportRow {
  unit_number: string;
  owner_name: string;
  email: string;
  phone: string;
  balance_due: number;
  oldest_invoice_date: string;
  days_past_due: number;
}

export function useDelinquencyReport() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['reports', 'delinquency', hoa?.id],
    queryFn: async (): Promise<DelinquencyReportRow[]> => {
      if (!hoa?.id) return [];

      const { data: units } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          unit_members(
            user_id,
            is_primary,
            profiles:profiles(first_name, last_name, email, phone)
          )
        `)
        .eq('hoa_id', hoa.id)
        .eq('status', 'active');

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, unit_id, amount, discount, late_fee, due_date, status, payments(amount)')
        .eq('hoa_id', hoa.id)
        .in('status', ['pending', 'partial', 'overdue'])
        .is('deleted_at', null);

      const today = new Date();
      const reportData: DelinquencyReportRow[] = [];

      (units || []).forEach((unit: any) => {
        const unitInvoices = (invoices || []).filter(inv => inv.unit_id === unit.id);
        
        let balance_due = 0;
        let oldest_due_date: Date | null = null;

        unitInvoices.forEach((inv: any) => {
          const dueDate = parseISO(inv.due_date);
          if (dueDate < today) {
            const totalDue = parseFloat(String(inv.amount)) - 
                            parseFloat(String(inv.discount || 0)) + 
                            parseFloat(String(inv.late_fee || 0));
            const paid = (inv.payments || []).reduce(
              (sum: number, p: any) => sum + parseFloat(String(p.amount)),
              0
            );
            const remaining = totalDue - paid;

            if (remaining > 0) {
              balance_due += remaining;
              if (!oldest_due_date || dueDate < oldest_due_date) {
                oldest_due_date = dueDate;
              }
            }
          }
        });

        if (balance_due > 0 && oldest_due_date) {
          const primaryMember = unit.unit_members?.find((m: any) => m.is_primary);
          const profile = primaryMember?.profiles;

          reportData.push({
            unit_number: unit.unit_number,
            owner_name: profile 
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
              : '-',
            email: profile?.email || '-',
            phone: profile?.phone || '-',
            balance_due,
            oldest_invoice_date: oldest_due_date.toISOString().split('T')[0],
            days_past_due: Math.floor((today.getTime() - oldest_due_date.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      });

      return reportData.sort((a, b) => b.days_past_due - a.days_past_due);
    },
    enabled: !!hoa?.id,
  });
}

export interface UnitLedgerRow {
  date: string;
  description: string;
  type: 'invoice' | 'payment';
  debit: number;
  credit: number;
  balance: number;
}

export function useUnitLedgerReport(unitId?: string) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['reports', 'unit-ledger', hoa?.id, unitId],
    queryFn: async (): Promise<UnitLedgerRow[]> => {
      if (!hoa?.id) return [];

      // Get all invoices
      const invoiceQuery = supabase
        .from('invoices')
        .select('id, title, issue_date, amount, discount, late_fee, unit_id, unit:units(unit_number)')
        .eq('hoa_id', hoa.id)
        .is('deleted_at', null);
      
      if (unitId) {
        invoiceQuery.eq('unit_id', unitId);
      }

      const { data: invoices } = await invoiceQuery;

      // Get all payments
      const paymentQuery = supabase
        .from('payments')
        .select('id, payment_date, amount, unit_id, invoice:invoices(title), unit:units(unit_number)')
        .eq('hoa_id', hoa.id);
      
      if (unitId) {
        paymentQuery.eq('unit_id', unitId);
      }

      const { data: payments } = await paymentQuery;

      // Combine and sort by date
      const entries: { date: string; entry: any; type: 'invoice' | 'payment' }[] = [];

      (invoices || []).forEach((inv: any) => {
        entries.push({
          date: inv.issue_date,
          entry: inv,
          type: 'invoice',
        });
      });

      (payments || []).forEach((p: any) => {
        entries.push({
          date: p.payment_date,
          entry: p,
          type: 'payment',
        });
      });

      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let balance = 0;
      const ledger: UnitLedgerRow[] = entries.map(({ date, entry, type }) => {
        let debit = 0;
        let credit = 0;
        let description = '';

        if (type === 'invoice') {
          debit = parseFloat(String(entry.amount)) - 
                  parseFloat(String(entry.discount || 0)) + 
                  parseFloat(String(entry.late_fee || 0));
          description = `Invoice: ${entry.title} (Unit ${entry.unit?.unit_number})`;
          balance += debit;
        } else {
          credit = parseFloat(String(entry.amount));
          description = `Payment: ${entry.invoice?.title || 'Payment'} (Unit ${entry.unit?.unit_number})`;
          balance -= credit;
        }

        return {
          date,
          description,
          type,
          debit,
          credit,
          balance,
        };
      });

      return ledger;
    },
    enabled: !!hoa?.id,
  });
}
