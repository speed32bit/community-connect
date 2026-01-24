import { useState } from 'react';
import { BarChart3, Download, FileText, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

const REPORT_TYPES = [
  {
    id: 'aging',
    title: 'Aging Report',
    description: 'Outstanding balances by aging bucket (current, 30, 60, 90+ days)',
    icon: DollarSign,
  },
  {
    id: 'collection',
    title: 'Collection Summary',
    description: 'Monthly collections with payment method breakdown',
    icon: TrendingUp,
  },
  {
    id: 'delinquency',
    title: 'Delinquency Report',
    description: 'List of units with past-due balances and contact info',
    icon: FileText,
  },
  {
    id: 'unit-ledger',
    title: 'Unit Ledger',
    description: 'Complete financial history for each unit',
    icon: Users,
  },
];

export default function Reports() {
  const { hoa } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: invoices } = useInvoices({ status: 'outstanding' });
  const { data: payments } = usePayments();

  const generateReport = (reportId: string) => {
    // For now, just show an alert - in production this would generate actual reports
    alert(`Generating ${reportId} report... This feature will export to CSV/PDF.`);
  };

  // Calculate some quick stats for the summary cards
  const totalOutstanding = stats?.totalOutstanding || 0;
  const totalCollected = stats?.collectedThisMonth || 0;
  const delinquentCount = invoices?.filter(inv => 
    new Date(inv.due_date) < new Date() && inv.status !== 'paid'
  ).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export financial reports"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delinquent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{delinquentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Select a report to generate and download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {REPORT_TYPES.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => generateReport(report.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
