import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BookOpen,
  PiggyBank,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  FolderOpen,
  Settings,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['board_admin', 'property_manager', 'resident'] },
  { title: 'Members & Units', icon: Users, href: '/members', roles: ['board_admin', 'property_manager'] },
  { title: 'Invoices', icon: FileText, href: '/invoices', roles: ['board_admin', 'property_manager', 'resident'] },
  { title: 'Payments', icon: CreditCard, href: '/payments', roles: ['board_admin', 'property_manager', 'resident'] },
  { title: 'Transactions', icon: BookOpen, href: '/transactions', roles: ['board_admin', 'property_manager'] },
  { title: 'Budgets', icon: PiggyBank, href: '/budgets', roles: ['board_admin', 'property_manager'] },
];

const operationsNavItems = [
  { title: 'Collections', icon: AlertTriangle, href: '/collections', roles: ['board_admin', 'property_manager'] },
  { title: 'Communications', icon: MessageSquare, href: '/communications', roles: ['board_admin', 'property_manager', 'resident'] },
  { title: 'Reports', icon: BarChart3, href: '/reports', roles: ['board_admin', 'property_manager'] },
  { title: 'Documents', icon: FolderOpen, href: '/documents', roles: ['board_admin', 'property_manager', 'resident'] },
];

const adminNavItems = [
  { title: 'Settings', icon: Settings, href: '/settings', roles: ['board_admin'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { userRole, hoa } = useAuth();

  const filterByRole = (items: typeof mainNavItems) => {
    if (!userRole) return [];
    return items.filter(item => item.roles.includes(userRole.role));
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">
              {hoa?.name || 'HOA Manager'}
            </span>
            <span className="text-xs text-muted-foreground">
              Management Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(mainNavItems).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(operationsNavItems).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filterByRole(adminNavItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(adminNavItems).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} HOA Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
