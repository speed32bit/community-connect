/**
 * Budget Import/Export Utilities
 * Handle CSV import and export for budgets and budget lines
 */

import { BudgetLine } from '@/hooks/useBudgets';

export interface BudgetCSVData {
  category: string;
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
  total: number;
}

/**
 * Export budget lines to CSV format
 */
export function exportBudgetToCSV(budgetLines: BudgetLine[], budgetName: string): string {
  const headers = [
    'Category',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'Annual Total',
  ];

  const rows = budgetLines.map((line) => [
    `"${line.category_name}"`, // Quote category names in case they contain commas
    formatNumber(line.january),
    formatNumber(line.february),
    formatNumber(line.march),
    formatNumber(line.april),
    formatNumber(line.may),
    formatNumber(line.june),
    formatNumber(line.july),
    formatNumber(line.august),
    formatNumber(line.september),
    formatNumber(line.october),
    formatNumber(line.november),
    formatNumber(line.december),
    formatNumber(line.annual_total),
  ]);

  const csvContent = [
    `Budget: ${budgetName}`,
    `Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Parse CSV data for budget import
 */
export function parseCSVForBudgetImport(csvContent: string): BudgetCSVData[] {
  const lines = csvContent.trim().split('\n');

  // Skip metadata lines (Budget:, Generated:, empty line)
  const dataStartIndex = lines.findIndex(
    (line) => line.toLowerCase().includes('category') && line.toLowerCase().includes('january')
  );

  if (dataStartIndex === -1) {
    throw new Error('CSV is missing headers. Expected "Category" and "January" columns.');
  }

  const dataLines = lines.slice(dataStartIndex + 1);
  const parsed: BudgetCSVData[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const values = parseCSVLine(line);

    if (values.length < 13) {
      // Must have at least category + 12 months
      continue;
    }

    try {
      const data: BudgetCSVData = {
        category: values[0].trim().replace(/^"|"$/g, ''), // Remove quotes
        january: parseFloat(values[1]) || 0,
        february: parseFloat(values[2]) || 0,
        march: parseFloat(values[3]) || 0,
        april: parseFloat(values[4]) || 0,
        may: parseFloat(values[5]) || 0,
        june: parseFloat(values[6]) || 0,
        july: parseFloat(values[7]) || 0,
        august: parseFloat(values[8]) || 0,
        september: parseFloat(values[9]) || 0,
        october: parseFloat(values[10]) || 0,
        november: parseFloat(values[11]) || 0,
        december: parseFloat(values[12]) || 0,
        total: parseFloat(values[13]) || 0,
      };

      // Validate that numbers are valid
      if (!isNaN(data.january)) {
        parsed.push(data);
      }
    } catch (e) {
      console.warn('Failed to parse CSV line:', line, e);
    }
  }

  if (parsed.length === 0) {
    throw new Error('No valid budget data found in CSV.');
  }

  return parsed;
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validate imported budget data
 */
export function validateBudgetImport(data: BudgetCSVData[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    errors.push('No budget lines found in import data.');
    return { isValid: false, errors, warnings };
  }

  data.forEach((line, index) => {
    if (!line.category) {
      errors.push(`Line ${index + 1}: Category name is required.`);
    }

    const months = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];

    const monthTotal = months.reduce((sum, month) => sum + (line[month as keyof BudgetCSVData] as number || 0), 0);

    if (monthTotal === 0) {
      warnings.push(
        `Line ${index + 1} (${line.category}): No monthly amounts found. This line will be created with zero values.`
      );
    }

    const tolerance = 0.01;
    if (line.total && Math.abs(monthTotal - line.total) > tolerance) {
      warnings.push(
        `Line ${index + 1} (${line.category}): Monthly total (${monthTotal.toFixed(2)}) doesn't match Annual Total (${line.total.toFixed(2)}). The sum of months will be used.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper functions
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
