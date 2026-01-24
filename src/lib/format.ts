import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(1)}%`;
}

export function getAgingBucket(dueDate: string | Date): string {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'current';
  if (diffDays <= 30) return '1-30';
  if (diffDays <= 60) return '31-60';
  if (diffDays <= 90) return '61-90';
  return '90+';
}

export function calculateDaysOverdue(dueDate: string | Date): number {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
