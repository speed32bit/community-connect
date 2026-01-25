import { useState } from 'react';
import { CreditCard, Search, FileDown, Loader2 } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { downloadCSV, formatCurrencyForCSV, formatDateForCSV } from '@/lib/csv-export';
import { useToast } from '@/hooks/use-toast';

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data: payments, isLoading } = usePayments();
  const { toast } = useToast();

  const filteredPayments = payments?.filter((payment) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      payment.invoice?.title?.toLowerCase().includes(search) ||
      payment.invoice?.invoice_number?.toLowerCase().includes(search) ||
      payment.unit?.unit_number?.toLowerCase().includes(search) ||
      payment.reference_number?.toLowerCase().includes(search)
    );
  });

  const handleExport = () => {
    if (!payments || payments.length === 0) {
      toast({ title: 'No data', description: 'No payments to export' });
      return;
    }
    
    setExporting(true);
    try {
      const exportData = payments.map(p => ({
        'Date': formatDateForCSV(p.payment_date),
        'Unit': p.unit?.unit_number || '',
        'Invoice': p.invoice?.invoice_number || '',
        'Invoice Title': p.invoice?.title || '',
        'Amount': formatCurrencyForCSV(Number(p.amount)),
        'Method': p.payment_method.replace('_', ' '),
        'Reference': p.reference_number || '',
        'Notes': p.notes || '',
      }));
      downloadCSV(exportData, 'payments_export');
      toast({ title: 'Export complete', description: 'Payments exported successfully' });
    } finally {
      setExporting(false);
    }
  };

  const getMethodBadge = (method: string) => {
    const variants: Record<string, string> = {
      check: 'bg-primary/10 text-primary',
      cash: 'bg-success/10 text-success',
      bank_transfer: 'bg-primary/10 text-primary',
      credit_card: 'bg-warning/10 text-warning',
      ach: 'bg-primary/10 text-primary',
      other: 'bg-muted text-muted-foreground',
    };
    return (
      <Badge variant="outline" className={variants[method] || variants.other}>
        {method.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View and manage payment history"
        actions={
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : filteredPayments?.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments found"
              description="Payments will appear here once recorded."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="font-medium">
                      {payment.unit?.unit_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.invoice?.title || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.invoice?.invoice_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.reference_number || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
