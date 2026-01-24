import { DollarSign, AlertTriangle, TrendingUp, Users, CreditCard, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useDashboardChart, useRecentActivity } from '@/hooks/useDashboard';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const { profile, userRole, isManager } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-4 w-4 text-success" />;
      case 'invoice':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'announcement':
        return <MessageSquare className="h-4 w-4 text-warning" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.first_name || 'there'}!`}
        description="Here's what's happening with your HOA today."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Outstanding"
          value={formatCurrency(stats?.totalOutstanding || 0)}
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Collected This Month"
          value={formatCurrency(stats?.collectedThisMonth || 0)}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Past Due (All)"
          value={formatCurrency(
            (stats?.pastDue1to30 || 0) + 
            (stats?.pastDue31to60 || 0) + 
            (stats?.pastDue61to90 || 0) + 
            (stats?.pastDue90Plus || 0)
          )}
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="Active Members"
          value={stats?.activeMembers || 0}
          subtitle={`${stats?.totalUnits || 0} total units`}
          icon={Users}
          variant="default"
        />
      </div>

      {/* Aging Breakdown */}
      {isManager && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">1-30 Days</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(stats?.pastDue1to30 || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">31-60 Days</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(stats?.pastDue31to60 || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">61-90 Days</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(stats?.pastDue61to90 || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">90+ Days</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(stats?.pastDue90Plus || 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoiced vs Collected</CardTitle>
            <CardDescription>Last 12 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartLoading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="invoiced" name="Invoiced" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your HOA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activitiesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : activities?.length === 0 ? (
                <p className="text-muted-foreground">No recent activity</p>
              ) : (
                activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.amount && (
                        <p className="text-sm font-medium text-success">
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.date)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
