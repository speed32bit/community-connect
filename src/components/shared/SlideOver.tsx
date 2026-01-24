import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  width = 'md',
}: SlideOverProps) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-xl',
          widthClasses[width],
          'slide-in-from-right'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">{children}</div>
        </ScrollArea>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-3 border-t border-border p-6">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
