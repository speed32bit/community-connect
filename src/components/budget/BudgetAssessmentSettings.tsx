import { useState } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import {
  useBudgetAssignment,
  useCreateBudgetAssignment,
  useUpdateBudgetAssignment,
} from '@/hooks/useAssessments';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetAssessmentSettingsProps {
  budgetId: string;
  budgetName: string;
  budgetTotal: number;
  onSave?: () => void;
}

export function BudgetAssessmentSettings({
  budgetId,
  budgetName,
  budgetTotal,
  onSave,
}: BudgetAssessmentSettingsProps) {
  const { data: assignment, isLoading } = useBudgetAssignment(budgetId);
  const createAssignment = useCreateBudgetAssignment();
  const updateAssignment = useUpdateBudgetAssignment();

  const [commonAreaPercentage, setCommonAreaPercentage] = useState(
    assignment?.common_area_percentage ?? 45
  );
  const [autoInvoice, setAutoInvoice] = useState(
    assignment?.auto_invoice_enabled ?? false
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (assignment) {
        await updateAssignment.mutateAsync({
          budget_id: budgetId,
          common_area_percentage: commonAreaPercentage,
          auto_invoice_enabled: autoInvoice,
        });
      } else {
        await createAssignment.mutateAsync({
          budget_id: budgetId,
          common_area_percentage: commonAreaPercentage,
          auto_invoice_enabled: autoInvoice,
        });
      }
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const privateAreaPercentage = 100 - commonAreaPercentage;
  const commonAreaBudget = budgetTotal * (commonAreaPercentage / 100);
  const privateAreaBudget = budgetTotal * (privateAreaPercentage / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Settings</CardTitle>
        <CardDescription>
          Configure how unit assessments are calculated from the {budgetName} budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Assessment allocation uses a two-factor method: square footage for private areas +
            equal share for common areas
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="commonArea" className="text-base font-semibold">
              Common Area Percentage
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              What percentage of the budget is for shared/common areas?
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="commonArea"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commonAreaPercentage}
                  onChange={(e) =>
                    setCommonAreaPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                  }
                  className="text-lg"
                />
              </div>
              <span className="text-lg font-semibold whitespace-nowrap">%</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Common Area Budget:</span> ${commonAreaBudget.toFixed(2)} (
              {commonAreaPercentage.toFixed(2)}%)
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Private Area Budget:</span> ${privateAreaBudget.toFixed(2)} (
              {privateAreaPercentage.toFixed(2)}%)
            </div>
            <div className="text-sm text-gray-700 pt-2 border-t border-blue-200">
              <span className="font-semibold">Total Budget:</span> ${budgetTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoInvoice" className="text-base font-semibold">
                Auto-Generate Invoices
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Automatically create invoices for all units based on these assessments
              </p>
            </div>
            <Switch
              id="autoInvoice"
              checked={autoInvoice}
              onCheckedChange={setAutoInvoice}
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || createAssignment.isPending || updateAssignment.isPending}
          className="w-full"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Save Assessment Settings
        </Button>
      </CardContent>
    </Card>
  );
}
