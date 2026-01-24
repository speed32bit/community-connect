import { useState } from 'react';
import { Plus, FileDown, Search } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, getAgingBucket } from '@/lib/format';
import { InvoiceWithDetails, InvoiceStatus } from '@/types/database';
import { InvoiceSlideOver } from '@/components/invoices/InvoiceSlideOver';
import { CreateInvoiceDialog } from '@/components/invoices/CreateInvoiceDialog';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function Invoices() {
  const { isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'outstanding' | 'all' | 'deleted'>('outstanding');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: invoices, isLoading } = useInvoices({ status: activeTab });
  const { data: stats } = useDashboardStats();

  const filteredInvoices = invoices?.filter((inv) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      inv.title?.toLowerCase().includes(search) ||
      inv.invoice_number?.toLowerCase().includes(search) ||
      inv.unit?.unit_number?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage and track all invoices for your HOA"
        actions={
          isManager && (
            <div className="flex gap-3">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          )
        }
      />

      {/* KPI Cards */}
      {isManager && (
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="1-30 Days Past Due"
            value={formatCurrency(stats?.pastDue1to30 || 0)}
            variant="warning"
          />
          <KPICard
            title="31-60 Days Past Due"
            value={formatCurrency(stats?.pastDue31to60 || 0)}
            variant="warning"
          />
          <KPICard
            title="61-90 Days Past Due"
            value={formatCurrency(stats?.pastDue61to90 || 0)}
            variant="destructive"
          />
          <KPICard
            title="90+ Days Past Due"
            value={formatCurrency(stats?.pastDue90Plus || 0)}
            variant="destructive"
          />
        </div>
      )}

      {/* Invoice Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              {isManager && <TabsTrigger value="deleted">Deleted</TabsTrigger>}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">Loading invoices...</p>
                </div>
              ) : filteredInvoices?.length === 0 ? (
                <EmptyState
                  icon={FileDown}
                  title="No invoices found"
                  description={activeTab === 'outstanding' 
                    ? "Great news! There are no outstanding invoices." 
                    : "No invoices match your search criteria."}
                  action={isManager ? { label: 'Create Invoice', onClick: () => setShowCreateDialog(true) } : undefined}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Account</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.unit?.unit_number || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.invoice_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">{formatCurrency(invoice.remaining_balance)}</p>
                            {invoice.remaining_balance !== invoice.amount && (
                              <p className="text-sm text-muted-foreground">
                                of {formatCurrency(invoice.amount)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell>
                          <div>
                            <p>{formatDate(invoice.due_date)}</p>
                            {invoice.status === 'overdue' && (
                              <p className="text-sm text-destructive">
                                {getAgingBucket(invoice.due_date)} days
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{invoice.deposit_account?.name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Invoice Detail Slide Over */}
      <InvoiceSlideOver
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
