import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Plus, Calendar } from 'lucide-react';
import { useBudgets, useCreateBudget } from '@/hooks/useBudgets';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

export default function Budgets() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: '',
    fiscal_year: new Date().getFullYear(),
  });

  const { data: budgets, isLoading } = useBudgets();
  const createBudget = useCreateBudget();

  const handleCreate = async () => {
    await createBudget.mutateAsync(newBudget);
    setShowCreateDialog(false);
    setNewBudget({ name: '', fiscal_year: new Date().getFullYear() });
  };

  const handleBudgetClick = (budgetId: string) => {
    navigate(`/budgets/${budgetId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Plan and track annual budgets"
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading budgets...</p>
        </div>
      ) : budgets?.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets created"
          description="Create your first annual budget to start tracking finances."
          action={{
            label: 'Create Budget',
            onClick: () => setShowCreateDialog(true),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets?.map((budget) => (
            <Card 
              key={budget.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleBudgetClick(budget.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.name}</CardTitle>
                  {budget.is_active && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  FY {budget.fiscal_year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-medium">{formatCurrency(budget.total_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(budget.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Budget Name</Label>
              <Input
                placeholder="e.g., Operating Budget 2024"
                value={newBudget.name}
                onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fiscal Year</Label>
              <Input
                type="number"
                value={newBudget.fiscal_year}
                onChange={(e) => setNewBudget({ ...newBudget, fiscal_year: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!newBudget.name || createBudget.isPending}
            >
              {createBudget.isPending ? 'Creating...' : 'Create Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
