import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';

interface DashboardStats {
  totalOutstanding: number;
  collectedThisMonth: number;
  pastDue1to30: number;
  pastDue31to60: number;
  pastDue61to90: number;
  pastDue90Plus: number;
  activeMembers: number;
  totalUnits: number;
}

interface ChartData {
  month: string;
  invoiced: number;
  collected: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'invoice' | 'announcement';
  title: string;
  description: string;
  amount?: number;
  date: string;
}

export function useDashboardStats() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'stats', hoa?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!hoa?.id) {
        return {
          totalOutstanding: 0,
          collectedThisMonth: 0,
          pastDue1to30: 0,
          pastDue31to60: 0,
          pastDue61to90: 0,
          pastDue90Plus: 0,
          activeMembers: 0,
          totalUnits: 0,
        };
      }

      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Get all outstanding invoices with their payments
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, amount, discount, late_fee, due_date, status, payments(amount)')
        .eq('hoa_id', hoa.id)
        .in('status', ['pending', 'partial', 'overdue'])
        .is('deleted_at', null);

      let totalOutstanding = 0;
      let pastDue1to30 = 0;
      let pastDue31to60 = 0;
      let pastDue61to90 = 0;
      let pastDue90Plus = 0;

      (invoices || []).forEach((inv) => {
        const totalDue = parseFloat(String(inv.amount)) - 
                        parseFloat(String(inv.discount || 0)) + 
                        parseFloat(String(inv.late_fee || 0));
        const paid = (inv.payments || []).reduce(
          (sum: number, p: any) => sum + parseFloat(String(p.amount)),
          0
        );
        const remaining = totalDue - paid;
        
        if (remaining > 0) {
          totalOutstanding += remaining;

          const dueDate = parseISO(inv.due_date);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysOverdue > 0) {
            if (daysOverdue <= 30) pastDue1to30 += remaining;
            else if (daysOverdue <= 60) pastDue31to60 += remaining;
            else if (daysOverdue <= 90) pastDue61to90 += remaining;
            else pastDue90Plus += remaining;
          }
        }
      });

      // Get payments this month
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('hoa_id', hoa.id)
        .gte('payment_date', monthStart.toISOString().split('T')[0])
        .lte('payment_date', monthEnd.toISOString().split('T')[0]);

      const collectedThisMonth = (payments || []).reduce(
        (sum, p) => sum + parseFloat(String(p.amount)),
        0
      );

      // Get unit and member counts
      const { count: totalUnits } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .eq('hoa_id', hoa.id)
        .eq('status', 'active');

      const { count: activeMembers } = await supabase
        .from('unit_members')
        .select('*, units!inner(hoa_id)', { count: 'exact', head: true })
        .eq('units.hoa_id', hoa.id)
        .is('move_out_date', null);

      return {
        totalOutstanding,
        collectedThisMonth,
        pastDue1to30,
        pastDue31to60,
        pastDue61to90,
        pastDue90Plus,
        activeMembers: activeMembers || 0,
        totalUnits: totalUnits || 0,
      };
    },
    enabled: !!hoa?.id,
  });
}

export function useDashboardChart() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'chart', hoa?.id],
    queryFn: async (): Promise<ChartData[]> => {
      if (!hoa?.id) return [];

      const today = new Date();
      const startDate = startOfMonth(subMonths(today, 11));
      const endDate = endOfMonth(today);

      // Fetch all invoices and payments for the last 12 months in one query each
      const [invoicesResult, paymentsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('issue_date, amount, discount, late_fee')
          .eq('hoa_id', hoa.id)
          .gte('issue_date', startDate.toISOString().split('T')[0])
          .lte('issue_date', endDate.toISOString().split('T')[0])
          .is('deleted_at', null),
        supabase
          .from('payments')
          .select('payment_date, amount')
          .eq('hoa_id', hoa.id)
          .gte('payment_date', startDate.toISOString().split('T')[0])
          .lte('payment_date', endDate.toISOString().split('T')[0]),
      ]);

      const invoices = invoicesResult.data || [];
      const payments = paymentsResult.data || [];

      // Build chart data by grouping by month
      const chartData: ChartData[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const invoiced = invoices
          .filter(inv => {
            const date = parseISO(inv.issue_date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce(
            (sum, inv) => sum + parseFloat(String(inv.amount)) - 
                          parseFloat(String(inv.discount || 0)) + 
                          parseFloat(String(inv.late_fee || 0)),
            0
          );

        const collected = payments
          .filter(p => {
            const date = parseISO(p.payment_date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce(
            (sum, p) => sum + parseFloat(String(p.amount)),
            0
          );

        chartData.push({
          month: format(monthDate, 'MMM'),
          invoiced,
          collected,
        });
      }

      return chartData;
    },
    enabled: !!hoa?.id,
  });
}

export function useRecentActivity() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'activity', hoa?.id],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!hoa?.id) return [];

      const activities: RecentActivity[] = [];

      // Get recent payments
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, payment_date, invoice:invoices(title, unit:units(unit_number))')
        .eq('hoa_id', hoa.id)
        .order('created_at', { ascending: false })
        .limit(5);

      (payments || []).forEach((p: any) => {
        activities.push({
          id: p.id,
          type: 'payment',
          title: 'Payment Received',
          description: `Unit ${p.invoice?.unit?.unit_number || 'Unknown'} - ${p.invoice?.title || 'Invoice'}`,
          amount: parseFloat(String(p.amount)),
          date: p.payment_date,
        });
      });

      // Get recent invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, title, amount, issue_date, unit:units(unit_number)')
        .eq('hoa_id', hoa.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      (invoices || []).forEach((inv: any) => {
        activities.push({
          id: inv.id,
          type: 'invoice',
          title: 'Invoice Created',
          description: `Unit ${inv.unit?.unit_number || 'Unknown'} - ${inv.title}`,
          amount: parseFloat(String(inv.amount)),
          date: inv.issue_date,
        });
      });

      // Get recent announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title, publish_date')
        .eq('hoa_id', hoa.id)
        .order('created_at', { ascending: false })
        .limit(3);

      (announcements || []).forEach((a) => {
        activities.push({
          id: a.id,
          type: 'announcement',
          title: 'Announcement Posted',
          description: a.title,
          date: a.publish_date,
        });
      });

      // Sort by date and take top 10
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
    enabled: !!hoa?.id,
  });
}
