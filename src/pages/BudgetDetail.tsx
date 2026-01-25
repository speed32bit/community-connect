import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Edit2 } from 'lucide-react';
import { useBudget, useBudgetLines, useCreateBudgetLine, useUpdateBudgetLine, useDeleteBudgetLine, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/format';
import { BudgetLine } from '@/hooks/useBudgets';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
] as const;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MonthKey = typeof MONTHS[number];

interface LineItemForm {
  category_name: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

const emptyLineForm: LineItemForm = {
  category_name: '',
  january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
  july: 0, august: 0, september: 0, october: 0, november: 0, december: 0,
};

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: budget, isLoading } = useBudget(id || null);
  const { data: lines } = useBudgetLines(id || null);
  const createLine = useCreateBudgetLine();
  const updateLine = useUpdateBudgetLine();
  const deleteLine = useDeleteBudgetLine();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [showLineDialog, setShowLineDialog] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [lineForm, setLineForm] = useState<LineItemForm>(emptyLineForm);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<string | null>(null);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState(false);

  const handleOpenLineDialog = (line?: BudgetLine) => {
    if (line) {
      setEditingLine(line);
      setLineForm({
        category_name: line.category_name,
        january: Number(line.january) || 0,
        february: Number(line.february) || 0,
        march: Number(line.march) || 0,
        april: Number(line.april) || 0,
        may: Number(line.may) || 0,
        june: Number(line.june) || 0,
        july: Number(line.july) || 0,
        august: Number(line.august) || 0,
        september: Number(line.september) || 0,
        october: Number(line.october) || 0,
        november: Number(line.november) || 0,
        december: Number(line.december) || 0,
      });
    } else {
      setEditingLine(null);
      setLineForm(emptyLineForm);
    }
    setShowLineDialog(true);
  };

  const handleSaveLine = async () => {
    if (!id) return;

    // annual_total is a computed column in the database, so we don't include it
    const { category_name, january, february, march, april, may, june, july, august, september, october, november, december } = lineForm;

    if (editingLine) {
      await updateLine.mutateAsync({
        id: editingLine.id,
        category_name,
        january, february, march, april, may, june, july, august, september, october, november, december,
      });
    } else {
      await createLine.mutateAsync({
        budget_id: id,
        category_name,
        january, february, march, april, may, june, july, august, september, october, november, december,
      });
    }
    setShowLineDialog(false);
    setLineForm(emptyLineForm);
    setEditingLine(null);
  };

  const handleConfirmDeleteLine = (lineId: string) => {
    setLineToDelete(lineId);
    setShowDeleteDialog(true);
  };

  const handleDeleteLine = async () => {
    if (lineToDelete) {
      await deleteLine.mutateAsync(lineToDelete);
      setShowDeleteDialog(false);
      setLineToDelete(null);
    }
  };

  const handleDeleteBudget = async () => {
    if (id) {
      await deleteBudget.mutateAsync(id);
      navigate('/budgets');
    }
  };

  const handleToggleActive = async () => {
    if (budget) {
      await updateBudget.mutateAsync({ id: budget.id, is_active: !budget.is_active });
    }
  };

  const getMonthTotal = (month: MonthKey) => {
    return (lines || []).reduce((sum, line) => sum + (Number(line[month]) || 0), 0);
  };

  const grandTotal = (lines || []).reduce((sum, line) => sum + (Number(line.annual_total) || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Budget not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={budget.name}
        description={`Fiscal Year ${budget.fiscal_year}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/budgets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              variant={budget.is_active ? "secondary" : "default"}
              onClick={handleToggleActive}
              disabled={updateBudget.isPending}
            >
              {budget.is_active ? 'Mark Inactive' : 'Set as Active'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteBudgetDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(grandTotal)}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={budget.is_active ? "default" : "secondary"}>
              {budget.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lines?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Budget Line Items</CardTitle>
            <CardDescription>Monthly budget allocation by category</CardDescription>
          </div>
          <Button onClick={() => handleOpenLineDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Category</TableHead>
                  {MONTH_LABELS.map((month) => (
                    <TableHead key={month} className="text-right min-w-[80px]">{month}</TableHead>
                  ))}
                  <TableHead className="text-right min-w-[100px]">Annual</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                      No budget line items yet. Click "Add Line Item" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.category_name}</TableCell>
                      {MONTHS.map((month) => (
                        <TableCell key={month} className="text-right text-sm">
                          {formatCurrency(Number(line[month]) || 0)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(line.annual_total) || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleOpenLineDialog(line)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleConfirmDeleteLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {lines && lines.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    {MONTHS.map((month) => (
                      <TableCell key={month} className="text-right font-bold">
                        {formatCurrency(getMonthTotal(month))}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold">
                      {formatCurrency(grandTotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Line Item Dialog */}
      <Dialog open={showLineDialog} onOpenChange={setShowLineDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLine ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Landscaping, Insurance, Utilities"
                value={lineForm.category_name}
                onChange={(e) => setLineForm({ ...lineForm, category_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {MONTHS.map((month, idx) => (
                <div key={month} className="space-y-1">
                  <Label className="text-sm">{MONTH_LABELS[idx]}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lineForm[month]}
                    onChange={(e) => setLineForm({ ...lineForm, [month]: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Annual Total:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(MONTHS.reduce((sum, month) => sum + (lineForm[month] || 0), 0))}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLine} 
              disabled={!lineForm.category_name || createLine.isPending || updateLine.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {createLine.isPending || updateLine.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Line Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Line Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget line item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLine}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Budget Confirmation */}
      <AlertDialog open={showDeleteBudgetDialog} onOpenChange={setShowDeleteBudgetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire budget? All line items will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
