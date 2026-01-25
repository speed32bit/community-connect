import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireManager?: boolean;
  requireBoardAdmin?: boolean;
}

export function ProtectedRoute({ children, requireManager = false, requireBoardAdmin = false }: ProtectedRouteProps) {
  const { user, isManager, isBoardAdmin, userRole } = useAuth();
  const location = useLocation();

  // Simple check - if no user, redirect to sign in
  if (!user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  if (!userRole) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireBoardAdmin && !isBoardAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (requireManager && !isManager) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
