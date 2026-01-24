import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@/types/database';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          className: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
        };
      case 'partial':
        return {
          label: 'Partial',
          className: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
        };
      case 'draft':
        return {
          label: 'Draft',
          className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border line-through',
        };
      case 'deleted':
        return {
          label: 'Deleted',
          className: 'bg-destructive/5 text-destructive/70 hover:bg-destructive/10 border-destructive/10',
        };
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
