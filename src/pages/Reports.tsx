import { useState } from 'react';
import { Download, FileText, DollarSign, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAgingReport, useCollectionReport, useDelinquencyReport, useUnitLedgerReport } from '@/hooks/useReports';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { downloadCSV, formatCurrencyForCSV } from '@/lib/csv-export';
import { useToast } from '@/hooks/use-toast';

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
    description: 'Complete financial history for all units',
    icon: Users,
  },
];

export default function Reports() {
  const { hoa } = useAuth();
  const { toast } = useToast();
  const { data: stats } = useDashboardStats();
  const { data: agingData, refetch: refetchAging } = useAgingReport();
  const { data: collectionData, refetch: refetchCollection } = useCollectionReport();
  const { data: delinquencyData, refetch: refetchDelinquency } = useDelinquencyReport();
  const { data: unitLedgerData, refetch: refetchUnitLedger } = useUnitLedgerReport();
  
  const [generating, setGenerating] = useState<string | null>(null);

  const generateReport = async (reportId: string) => {
    setGenerating(reportId);
    
    try {
      switch (reportId) {
        case 'aging':
          await refetchAging();
          if (!agingData || agingData.length === 0) {
            toast({ title: 'No data', description: 'No outstanding balances to report', variant: 'default' });
          } else {
            const formattedAging = agingData.map(row => ({
              'Unit': row.unit_number,
              'Owner': row.owner_name,
              'Current': formatCurrencyForCSV(row.current),
              '1-30 Days': formatCurrencyForCSV(row.days_1_30),
              '31-60 Days': formatCurrencyForCSV(row.days_31_60),
              '61-90 Days': formatCurrencyForCSV(row.days_61_90),
              '90+ Days': formatCurrencyForCSV(row.days_90_plus),
              'Total Due': formatCurrencyForCSV(row.total_due),
            }));
            downloadCSV(formattedAging, 'aging_report');
            toast({ title: 'Report generated', description: 'Aging report downloaded successfully' });
          }
          break;
          
        case 'collection':
          await refetchCollection();
          if (!collectionData || collectionData.length === 0) {
            toast({ title: 'No data', description: 'No payments to report', variant: 'default' });
          } else {
            const formattedCollection = collectionData.map(row => ({
              'Month': row.month,
              'Check': formatCurrencyForCSV(row.check),
              'ACH': formatCurrencyForCSV(row.ach),
              'Credit Card': formatCurrencyForCSV(row.credit_card),
              'Cash': formatCurrencyForCSV(row.cash),
              'Other': formatCurrencyForCSV(row.other),
              'Total': formatCurrencyForCSV(row.total),
            }));
            downloadCSV(formattedCollection, 'collection_summary');
            toast({ title: 'Report generated', description: 'Collection summary downloaded successfully' });
          }
          break;
          
        case 'delinquency':
          await refetchDelinquency();
          if (!delinquencyData || delinquencyData.length === 0) {
            toast({ title: 'No data', description: 'No delinquent accounts to report', variant: 'default' });
          } else {
            const formattedDelinquency = delinquencyData.map(row => ({
              'Unit': row.unit_number,
              'Owner': row.owner_name,
              'Email': row.email,
              'Phone': row.phone,
              'Balance Due': formatCurrencyForCSV(row.balance_due),
              'Oldest Invoice': row.oldest_invoice_date,
              'Days Past Due': row.days_past_due,
            }));
            downloadCSV(formattedDelinquency, 'delinquency_report');
            toast({ title: 'Report generated', description: 'Delinquency report downloaded successfully' });
          }
          break;
          
        case 'unit-ledger':
          await refetchUnitLedger();
          if (!unitLedgerData || unitLedgerData.length === 0) {
            toast({ title: 'No data', description: 'No financial transactions to report', variant: 'default' });
          } else {
            const formattedLedger = unitLedgerData.map(row => ({
              'Date': row.date,
              'Description': row.description,
              'Type': row.type,
              'Debit': row.debit > 0 ? formatCurrencyForCSV(row.debit) : '',
              'Credit': row.credit > 0 ? formatCurrencyForCSV(row.credit) : '',
              'Balance': formatCurrencyForCSV(row.balance),
            }));
            downloadCSV(formattedLedger, 'unit_ledger');
            toast({ title: 'Report generated', description: 'Unit ledger downloaded successfully' });
          }
          break;
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  // Calculate some quick stats for the summary cards
  const totalOutstanding = stats?.totalOutstanding || 0;
  const totalCollected = stats?.collectedThisMonth || 0;
  const delinquentCount = delinquencyData?.length || 0;

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
              Delinquent Accounts
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
          <CardDescription>Select a report to generate and download as CSV</CardDescription>
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
                    disabled={generating === report.id}
                  >
                    {generating === report.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
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
