import { useState } from 'react';
import { MailPlus, AlertCircle } from 'lucide-react';
import { useGenerateInvoicesFromBudget } from '@/hooks/useAssessments';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';

interface GenerateInvoicesDialogProps {
  budgetId: string;
  budgetName: string;
  budgetTotal: number;
  unitCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateInvoicesDialog({
  budgetId,
  budgetName,
  budgetTotal,
  unitCount,
  isOpen,
  onOpenChange,
}: GenerateInvoicesDialogProps) {
  const generateInvoices = useGenerateInvoicesFromBudget();
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState(
    `${budgetName} Assessment - Budget Year ${new Date().getFullYear()}`
  );
  const [sendImmediately, setSendImmediately] = useState(false);

  const handleGenerate = async () => {
    if (!dueDate) return;

    await generateInvoices.mutateAsync({
      budget_id: budgetId,
      due_date: dueDate,
      description,
      send_immediately: sendImmediately,
    });

    onOpenChange(false);
    setDueDate('');
    setDescription(`${budgetName} Assessment - Budget Year ${new Date().getFullYear()}`);
    setSendImmediately(false);
  };

  const averageAssessment = budgetTotal / Math.max(unitCount, 1);
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Assessment Invoices</DialogTitle>
          <DialogDescription>
            Create invoices for all units based on the {budgetName} budget
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will create <strong>{unitCount} invoices</strong> with an average assessment of{' '}
              <strong>{formatCurrency(averageAssessment)}</strong> per unit (
              <strong>{formatCurrency(averageAssessment / 12)}</strong> monthly).
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
            />
            <p className="text-xs text-gray-500">When are these assessments due?</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Invoice Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">Will appear on all generated invoices</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendImmediately"
              checked={sendImmediately}
              onCheckedChange={(checked) => setSendImmediately(checked === true)}
            />
            <Label htmlFor="sendImmediately" className="font-normal">
              Send invoices to unit owners immediately via email
            </Label>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
            <p className="font-semibold mb-1">Budget Summary:</p>
            <p>Total Budget: {formatCurrency(budgetTotal)}</p>
            <p>Number of Units: {unitCount}</p>
            <p>Avg Monthly Per Unit: {formatCurrency(averageAssessment / 12)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!dueDate || generateInvoices.isPending}
          >
            <MailPlus className="mr-2 h-4 w-4" />
            {generateInvoices.isPending ? 'Generating...' : 'Generate Invoices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
