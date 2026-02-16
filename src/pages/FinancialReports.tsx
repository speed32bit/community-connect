import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';

export default function FinancialReports() {
  const navigate = useNavigate();
  const { data: budgets, isLoading } = useBudgets();
  const [selectedBudgetYear, setSelectedBudgetYear] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Reports" description="Budget variance and collection analysis" />
        <div className="text-center py-12">Loading reports...</div>
      </div>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Reports" description="Budget variance and collection analysis" />
        <EmptyState
          title="No Budgets Created"
          description="Create a budget first to view financial reports"
          action={{
            label: 'Create Budget',
            onClick: () => navigate('/budgets'),
          }}
        />
      </div>
    );
  }

  const activeBudget = budgets.find((b) => b.is_active) || budgets[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Analyze budget variance, collections, and financial health"
      />

      <Tabs defaultValue="variance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="variance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Variance Report</CardTitle>
              <CardDescription>Budgeted vs. Actual Spending</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Variance analysis helps identify which budget categories are over or under
                  spending. Link your expense transactions to categories to track actual spending.
                </AlertDescription>
              </Alert>

              <div className="mt-6 space-y-4">
                {budgets.map((budget) => (
                  <Card
                    key={budget.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/budgets/${budget.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{budget.name}</CardTitle>
                          <CardDescription>Fiscal Year {budget.fiscal_year}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatCurrency(budget.total_amount || 0)}
                          </div>
                          {budget.is_active && (
                            <Badge className="mt-2">Active</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Click to view detailed variance analysis</span>
                        <span>→</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Metrics</CardTitle>
              <CardDescription>Payment tracking and delinquency analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Collection metrics show payment status by unit. Create invoices from budgets
                  to automatically track collections.
                </AlertDescription>
              </Alert>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Assessed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        budgets.reduce((sum, b) => sum + (b.total_amount || 0), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Collection Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-gray-500 mt-1">No invoices yet</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Outstanding
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-gray-500 mt-1">No invoices yet</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg Days Delinquent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-gray-500 mt-1">No past due</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4">Steps to Enable Collection Tracking:</h3>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>Create budgets</li>
                  <li>Configure assessment settings (common area %)</li>
                  <li>Generate invoices from budget</li>
                  <li>Record payments as they're received</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Trends</CardTitle>
              <CardDescription>Year-over-year budget growth analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead className="text-right">Budget Amount</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">% Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets
                    .sort((a, b) => b.fiscal_year - a.fiscal_year)
                    .map((budget, index) => {
                      const previousBudget = budgets[index + 1];
                      const percentChange =
                        previousBudget && previousBudget.total_amount
                          ? ((budget.total_amount! - previousBudget.total_amount) /
                              previousBudget.total_amount) *
                            100
                          : 0;
                      const change = budget.total_amount! - (previousBudget?.total_amount || 0);
                      const isIncrease = change >= 0;

                      return (
                        <TableRow key={budget.id}>
                          <TableCell className="font-medium">
                            {budget.fiscal_year}
                            {budget.is_active && <Badge className="ml-2">Active</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(budget.total_amount || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {previousBudget ? (
                              <div className="flex items-center justify-end gap-1">
                                {isIncrease ? (
                                  <TrendingUp className="w-4 h-4 text-red-500" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-green-500" />
                                )}
                                {formatCurrency(change)}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {previousBudget ? (
                              <span
                                className={
                                  isIncrease ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'
                                }
                              >
                                {isIncrease ? '+' : ''}{percentChange.toFixed(1)}%
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
