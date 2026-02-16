/**
 * Assessment Calculation Utilities
 * Handles all calculations for unit assessments based on budget and allocations
 */

export interface AssessmentCalculationParams {
  budgetTotal: number;
  units: Array<{
    id: string;
    unitNumber: string;
    squareFeet?: number;
  }>;
  totalSquareFeet: number;
  commonAreaPercentage: number; // e.g., 45.99 for 45.99%
}

export interface UnitAssessment {
  unitId: string;
  unitNumber: string;
  squareFeetAllocation: number;
  percentageAllocation: number;
  monthlyAssessment: number;
  annualAssessment: number;
}

/**
 * Calculate monthly assessment for each unit
 * Applies a two-factor allocation: square footage + common area percentage
 */
export function calculateUnitAssessments(
  params: AssessmentCalculationParams
): UnitAssessment[] {
  const { budgetTotal, units, totalSquareFeet, commonAreaPercentage } = params;

  // Calculate private space vs common area budget allocation
  const privateSpacePercentage = 100 - commonAreaPercentage;
  const commonAreaBudget = budgetTotal * (commonAreaPercentage / 100);
  const privateSpaceBudget = budgetTotal * (privateSpacePercentage / 100);

  return units.map((unit) => {
    const unitSquareFeet = unit.squareFeet || 0;
    const squareFeetAllocation = unitSquareFeet / totalSquareFeet;

    // Unit's share: percentage of private space based on sq ft + equal share of common area
    const unitShare =
      privateSpaceBudget * squareFeetAllocation +
      commonAreaBudget / units.length;

    const monthlyAssessment = unitShare / 12;
    const annualAssessment = unitShare;

    return {
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      squareFeetAllocation: unitSquareFeet,
      percentageAllocation: squareFeetAllocation * 100,
      monthlyAssessment: Math.round(monthlyAssessment * 100) / 100,
      annualAssessment: Math.round(annualAssessment * 100) / 100,
    };
  });
}

/**
 * Calculate assessment by month (for variable monthly budgets)
 */
export function calculateMonthlyAssignments(
  monthlyBudgetAmounts: number[],
  units: Array<{ id: string; unitNumber: string; squareFeet?: number }>,
  totalSquareFeet: number,
  commonAreaPercentage: number
): { month: string; assessments: UnitAssessment[] }[] {
  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  return monthlyBudgetAmounts.map((budget, index) =>
    ({
      month: months[index],
      assessments: calculateUnitAssessments({
        budgetTotal: budget,
        units,
        totalSquareFeet,
        commonAreaPercentage,
      }),
    })
  );
}

/**
 * Calculate assessment by category (get breakdown of costs)
 */
export interface BudgetLineItem {
  id: string;
  category_name: string;
  annual_total: number;
}

export function calculateAssessmentByCategory(
  budgetLines: BudgetLineItem[],
  units: Array<{ id: string; unitNumber: string; squareFeet?: number }>,
  totalSquareFeet: number,
  commonAreaPercentage: number
): {
  category: string;
  amount: number;
  unitBreakdown: Array<{ unitNumber: string; share: number }>;
}[] {
  const results = budgetLines.map((line) => {
    const assessments = calculateUnitAssessments({
      budgetTotal: line.annual_total,
      units,
      totalSquareFeet,
      commonAreaPercentage,
    });

    return {
      category: line.category_name,
      amount: line.annual_total,
      unitBreakdown: assessments.map((assessment) => ({
        unitNumber: assessment.unitNumber,
        share: assessment.annualAssessment,
      })),
    };
  });

  return results;
}

/**
 * Validate calculation correctness (total should equal budget)
 */
export function validateAssessmentCalculation(
  budget: number,
  assessments: UnitAssessment[],
  tolerance: number = 0.01 // Allow $0.01 rounding difference
): { isValid: boolean; difference: number } {
  const total = assessments.reduce((sum, a) => sum + a.annualAssessment, 0);
  const difference = Math.abs(budget - total);
  return {
    isValid: difference <= tolerance,
    difference,
  };
}

/**
 * Calculate late fees and collection metrics
 */
export interface CollectionMetrics {
  totalAssessed: number;
  totalCollected: number;
  totalOverdue: number;
  collectionRate: number; // percentage
  averageDaysOverdue: number;
}

export function calculateCollectionMetrics(
  assessments: number[],
  payments: Array<{ amount: number; daysOverdue: number }>
): CollectionMetrics {
  const totalAssessed = assessments.reduce((sum, a) => sum + a, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = totalAssessed - totalCollected;
  const averageDaysOverdue =
    payments.length > 0
      ? payments.reduce((sum, p) => sum + p.daysOverdue, 0) / payments.length
      : 0;

  return {
    totalAssessed,
    totalCollected,
    totalOverdue,
    collectionRate: totalAssessed > 0 ? (totalCollected / totalAssessed) * 100 : 0,
    averageDaysOverdue,
  };
}
