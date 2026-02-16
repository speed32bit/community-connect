import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { useCalculateAssessments } from '@/hooks/useAssessments';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

interface AssessmentPreviewProps {
  budgetId: string;
  budgetTotal: number;
}

export function AssessmentPreview({ budgetId, budgetTotal }: AssessmentPreviewProps) {
  const { data: assessments, isLoading } = useCalculateAssessments(budgetId);

  const statistics = useMemo(() => {
    if (!assessments || assessments.length === 0) {
      return null;
    }

    const totalAssessed = assessments.reduce((sum, a) => sum + a.annualAssessment, 0);
    const avgAssessment =
      assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a.monthlyAssessment, 0) / assessments.length
        : 0;
    const minAssessment = Math.min(...assessments.map((a) => a.monthlyAssessment));
    const maxAssessment = Math.max(...assessments.map((a) => a.monthlyAssessment));

    return {
      totalAssessed,
      avgMonthly: avgAssessment,
      minMonthly: minAssessment,
      maxMonthly: maxAssessment,
      variance: maxAssessment - minAssessment,
      differenceFromBudget: Math.abs(budgetTotal - totalAssessed),
    };
  }, [assessments, budgetTotal]);

  if (isLoading || !assessments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment Preview</CardTitle>
          <CardDescription>No units available for assessment calculation</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.avgMonthly || 0)}
            </div>
            <p className="text-xs text-gray-500">per unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Min Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.minMonthly || 0)}
            </div>
            <p className="text-xs text-gray-500">smallest unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Max Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.maxMonthly || 0)}
            </div>
            <p className="text-xs text-gray-500">largest unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Annual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics?.totalAssessed || 0)}
            </div>
            <p className="text-xs text-gray-500">all units</p>
          </CardContent>
        </Card>
      </div>

      {statistics && statistics.differenceFromBudget > 0.01 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
          <TrendingDown className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <span className="font-semibold">Rounding Difference:</span> The total assessed amount
            differs from budget by {formatCurrency(statistics.differenceFromBudget)} due to rounding.
            This is normal and will balance out over time.
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment by Unit</CardTitle>
          <CardDescription>Monthly and annual assessment for each unit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Sq Ft</TableHead>
                  <TableHead className="text-right">% Allocation</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="text-right">Annual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.unitId}>
                    <TableCell className="font-medium">{assessment.unitNumber}</TableCell>
                    <TableCell className="text-right text-gray-600">
                      {assessment.squareFeetAllocation.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {assessment.percentageAllocation.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(assessment.monthlyAssessment)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(assessment.annualAssessment)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
