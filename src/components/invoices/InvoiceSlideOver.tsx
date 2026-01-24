import { useState } from 'react';
import { Edit, Send, Download, CreditCard, MoreVertical, Trash } from 'lucide-react';
import { SlideOver } from '@/components/shared/SlideOver';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import { InvoiceWithDetails } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { useDeleteInvoice } from '@/hooks/useInvoices';
import { toast } from 'sonner';

interface InvoiceSlideOverProps {
  invoice: InvoiceWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceSlideOver({ invoice, isOpen, onClose }: InvoiceSlideOverProps) {
  const { isManager } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const deleteInvoice = useDeleteInvoice();

  if (!invoice) return null;

  const originalCharge = parseFloat(String(invoice.amount));
  const discount = parseFloat(String(invoice.discount || 0));
  const lateFee = parseFloat(String(invoice.late_fee || 0));
  const totalDue = originalCharge - discount + lateFee;
  const totalPaid = (invoice.payments || []).reduce(
    (sum, p) => sum + parseFloat(String(p.amount)),
    0
  );
  const remainingBalance = totalDue - totalPaid;

  const handleSendReminder = () => {
    toast.success('Reminder sent (simulated)');
  };

  const handleDownloadPDF = () => {
    toast.success('PDF download will be available soon');
  };

  const handleDelete = () => {
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <>
      <SlideOver
        isOpen={isOpen}
        onClose={onClose}
        title={invoice.title}
        subtitle={`Invoice ${invoice.invoice_number}`}
        width="lg"
        actions={
          isManager && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setShowPaymentDialog(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </>
          )
        }
      >
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <StatusBadge status={invoice.status} />
            {isManager && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendReminder}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Invoice
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Remaining Balance - Prominent */}
          <div className="rounded-lg bg-primary/10 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
            <p className="mt-2 text-4xl font-bold text-primary">
              {formatCurrency(remainingBalance)}
            </p>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Invoice Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="font-medium">{invoice.unit?.unit_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{invoice.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recurring</p>
                <p className="font-medium">
                  {invoice.is_recurring 
                    ? `Yes (${invoice.recurring_frequency})` 
                    : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deposit Account</p>
                <p className="font-medium">{invoice.deposit_account?.name || '-'}</p>
              </div>
            </div>

            {invoice.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{invoice.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold">Financial Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Charge</span>
                <span>{formatCurrency(originalCharge)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {lateFee > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Late Fee</span>
                  <span>+{formatCurrency(lateFee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total Due</span>
                <span>{formatCurrency(totalDue)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Payments Made</span>
                <span>-{formatCurrency(totalPaid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Remaining</span>
                <span className={remainingBalance > 0 ? 'text-destructive' : 'text-success'}>
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Payment History</h3>
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.payment_date)} • {payment.payment_method}
                        </p>
                        {payment.reference_number && (
                          <p className="text-sm text-muted-foreground">
                            Ref: {payment.reference_number}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Last Edited */}
          <div className="pt-4 text-sm text-muted-foreground">
            Last edited: {formatDate(invoice.updated_at)}
          </div>
        </div>
      </SlideOver>

      <RecordPaymentDialog
        invoice={invoice}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
    </>
  );
}
