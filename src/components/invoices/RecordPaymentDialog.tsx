import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRecordPayment } from '@/hooks/usePayments';
import { InvoiceWithDetails, PaymentMethod } from '@/types/database';
import { formatCurrency } from '@/lib/format';

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['check', 'cash', 'bank_transfer', 'credit_card', 'ach', 'other']),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface RecordPaymentDialogProps {
  invoice: InvoiceWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({ invoice, open, onOpenChange }: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice?.remaining_balance || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'check',
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    if (!invoice) return;

    recordPayment.mutate(
      {
        invoice_id: invoice.id,
        unit_id: invoice.unit_id,
        amount: data.amount,
        payment_method: data.payment_method as PaymentMethod,
        payment_date: data.payment_date,
        reference_number: data.reference_number,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {invoice.invoice_number} - {invoice.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(invoice.remaining_balance)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              defaultValue="check"
              onValueChange={(value) => setValue('payment_method', value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="ach">ACH</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              {...register('payment_date')}
            />
            {errors.payment_date && (
              <p className="text-sm text-destructive">{errors.payment_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              placeholder="Check #, Transaction ID, etc."
              {...register('reference_number')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes"
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
