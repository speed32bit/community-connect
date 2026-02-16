/**
 * Financial Reporting Utilities
 * Calculations and metrics for budget tracking and variance analysis
 */

import { BudgetLine } from '@/hooks/useBudgets';

export interface BudgetVariance {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'over' | 'on-track';
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  variancePercent: number;
  status: 'under' | 'over' | 'on-track';
  categories: BudgetVariance[];
}

/**
 * Calculate budget variance (budgeted vs actual spending)
 */
export function calculateBudgetVariance(
  budgetLines: BudgetLine[],
  actualExpenses: Array<{
    categoryName: string;
    amount: number;
  }>
): BudgetSummary {
  const expenses = new Map<string, number>();

  // Aggregate actual expenses by category
  actualExpenses.forEach(({ categoryName, amount }) => {
    const current = expenses.get(categoryName) || 0;
    expenses.set(categoryName, current + amount);
  });

  const variances: BudgetVariance[] = budgetLines.map((line) => {
    const budgeted = Number(line.annual_total) || 0;
    const actual = expenses.get(line.category_name) || 0;
    const variance = budgeted - actual;
    const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

    // Status: under (positive variance), over (negative variance), on-track (±5%)
    let status: 'under' | 'over' | 'on-track';
    if (Math.abs(variancePercent) <= 5) {
      status = 'on-track';
    } else if (variance > 0) {
      status = 'under';
    } else {
      status = 'over';
    }

    return {
      category: line.category_name,
      budgeted,
      actual,
      variance,
      variancePercent,
      status,
    };
  });

  const totalBudgeted = variances.reduce((sum, v) => sum + v.budgeted, 0);
  const totalActual = variances.reduce((sum, v) => sum + v.actual, 0);
  const totalVariance = totalBudgeted - totalActual;
  const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

  // Overall status
  let overallStatus: 'under' | 'over' | 'on-track';
  if (Math.abs(totalVariancePercent) <= 5) {
    overallStatus = 'on-track';
  } else if (totalVariance > 0) {
    overallStatus = 'under';
  } else {
    overallStatus = 'over';
  }

  return {
    totalBudgeted,
    totalActual,
    totalVariance,
    variancePercent: totalVariancePercent,
    status: overallStatus,
    categories: variances,
  };
}

/**
 * Calculate month-to-date vs annual budget
 */
export interface BudgetProgress {
  elapsedMonths: number;
  expectedSpend: number;
  actualSpend: number;
  spendingRate: number; // percent
  onPaceAmount: number; // if trend continues
  projectedYearEnd: number;
}

export function calculateBudgetProgress(
  budgetTotal: number,
  actualSpend: number,
  currentMonth: number // 1-12
): BudgetProgress {
  const expectedSpend = (budgetTotal / 12) * currentMonth;
  const spendingRate = (actualSpend / expectedSpend) * 100;
  const projectedYearEnd = (actualSpend / currentMonth) * 12;
  const onPaceAmount = expectedSpend - actualSpend;

  return {
    elapsedMonths: currentMonth,
    expectedSpend,
    actualSpend,
    spendingRate,
    onPaceAmount,
    projectedYearEnd,
  };
}

/**
 * Calculate collection metrics
 */
export interface CollectionReport {
  totalAssessed: number;
  totalCollected: number;
  totalDelinquent: number;
  collectionRate: number;
  averageCollectionDays: number;
  unitMetrics: Array<{
    unitNumber: string;
    assessed: number;
    collected: number;
    balance: number;
    daysDelinquent: number;
  }>;
}

export function calculateCollectionReport(
  units: Array<{
    unitNumber: string;
    assessed: number;
  }>,
  payments: Array<{
    unitNumber: string;
    amount: number;
    daysToCollect: number;
  }>
): CollectionReport {
  const unitMetrics = units.map((unit) => {
    const unitPayments = payments.filter((p) => p.unitNumber === unit.unitNumber);
    const collected = unitPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = unit.assessed - collected;
    const avgDays =
      unitPayments.length > 0
        ? unitPayments.reduce((sum, p) => sum + p.daysToCollect, 0) / unitPayments.length
        : 0;

    return {
      unitNumber: unit.unitNumber,
      assessed: unit.assessed,
      collected,
      balance,
      daysDelinquent: Math.max(0, avgDays),
    };
  });

  const totalAssessed = units.reduce((sum, u) => sum + u.assessed, 0);
  const totalCollected = unitMetrics.reduce((sum, m) => sum + m.collected, 0);
  const totalDelinquent = unitMetrics.reduce((sum, m) => sum + Math.max(0, m.balance), 0);
  const collectionRate = totalAssessed > 0 ? (totalCollected / totalAssessed) * 100 : 0;
  const averageCollectionDays =
    unitMetrics.length > 0
      ? unitMetrics.reduce((sum, m) => sum + m.daysDelinquent, 0) / unitMetrics.length
      : 0;

  return {
    totalAssessed,
    totalCollected,
    totalDelinquent,
    collectionRate,
    averageCollectionDays,
    unitMetrics,
  };
}

/**
 * Generate budget trend analysis
 */
export interface BudgetTrend {
  year: number;
  budgetAmount: number;
  spentAmount: number;
  percentChange: number;
}

export function calculateBudgetTrends(
  budgets: Array<{
    fiscal_year: number;
    total_amount: number;
  }>,
  spending: Array<{
    fiscal_year: number;
    amount: number;
  }>
): BudgetTrend[] {
  const trends = budgets.map((budget, index) => {
    const spent = spending
      .filter((s) => s.fiscal_year === budget.fiscal_year)
      .reduce((sum, s) => sum + s.amount, 0);

    const previousBudget = index > 0 ? budgets[index - 1].total_amount : budget.total_amount;
    const percentChange =
      previousBudget > 0
        ? ((budget.total_amount - previousBudget) / previousBudget) * 100
        : 0;

    return {
      year: budget.fiscal_year,
      budgetAmount: budget.total_amount,
      spentAmount: spent,
      percentChange,
    };
  });

  return trends;
}

/**
 * Quick status indicators
 */
export function getVarianceStatus(variancePercent: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (Math.abs(variancePercent) <= 5) {
    return { label: 'On Track', color: 'green', icon: '✓' };
  } else if (variancePercent > 0) {
    return { label: 'Under Budget', color: 'blue', icon: '↓' };
  } else {
    return { label: 'Over Budget', color: 'red', icon: '↑' };
  }
}
