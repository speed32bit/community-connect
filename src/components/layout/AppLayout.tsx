import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { SidebarProvider } from '@/components/ui/sidebar';

export function AppLayout() {
  const { user, isLoading, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  // If user doesn't have a role yet, they need to complete onboarding
  if (!userRole) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
