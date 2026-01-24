import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useUnits } from '@/hooks/useUnits';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DuesFrequency } from '@/types/database';

const invoiceSchema = z.object({
  unit_id: z.string().min(1, 'Unit is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  due_date: z.string().min(1, 'Due date is required'),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  deposit_account_id: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const { hoa } = useAuth();
  const { data: units } = useUnits();
  const createInvoice = useCreateInvoice();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (hoa?.id) {
      // Fetch categories
      supabase
        .from('invoice_categories')
        .select('*')
        .eq('hoa_id', hoa.id)
        .then(({ data }) => setCategories(data || []));

      // Fetch deposit accounts
      supabase
        .from('deposit_accounts')
        .select('*')
        .eq('hoa_id', hoa.id)
        .then(({ data }) => setAccounts(data || []));
    }
  }, [hoa?.id]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      is_recurring: false,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const isRecurring = watch('is_recurring');

  const onSubmit = (data: InvoiceFormData) => {
    createInvoice.mutate(
      {
        unit_id: data.unit_id,
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        amount: data.amount,
        due_date: data.due_date,
        is_recurring: data.is_recurring,
        recurring_frequency: data.recurring_frequency as DuesFrequency | undefined,
        deposit_account_id: data.deposit_account_id,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for a unit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit_id">Unit *</Label>
            <Select onValueChange={(value) => setValue('unit_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_number} {unit.address && `- ${unit.address}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit_id && (
              <p className="text-sm text-destructive">{errors.unit_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Monthly HOA Dues"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details..."
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select onValueChange={(value) => setValue('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
              />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit_account_id">Deposit Account</Label>
              <Select onValueChange={(value) => setValue('deposit_account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="is_recurring">Recurring Invoice</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate this invoice on a schedule
              </p>
            </div>
            <Switch
              id="is_recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setValue('is_recurring', checked)}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurring_frequency">Frequency</Label>
              <Select onValueChange={(value) => setValue('recurring_frequency', value as DuesFrequency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
