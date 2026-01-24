import { useState } from 'react';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnits } from '@/hooks/useUnits';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { CreateUnitDialog } from '@/components/members/CreateUnitDialog';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: units, isLoading } = useUnits();

  const filteredUnits = units?.filter((unit) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const ownerName = unit.unit_members
      ?.filter(m => m.member_type === 'owner')
      .map(m => `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.toLowerCase())
      .join(' ');
    return (
      unit.unit_number?.toLowerCase().includes(search) ||
      unit.address?.toLowerCase().includes(search) ||
      ownerName?.includes(search)
    );
  });

  const getOwnerName = (unit: any) => {
    const owner = unit.unit_members?.find((m: any) => m.member_type === 'owner' && m.is_primary);
    if (owner?.profile) {
      return `${owner.profile.first_name || ''} ${owner.profile.last_name || ''}`.trim() || owner.profile.email;
    }
    return 'No owner assigned';
  };

  const getResidentCount = (unit: any) => {
    return unit.unit_members?.filter((m: any) => m.member_type === 'resident').length || 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members & Units"
        description="Manage units and their owners/residents"
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Units</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading units...</p>
            </div>
          ) : filteredUnits?.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No units found"
              description="Get started by adding your first unit."
              action={{ label: 'Add Unit', onClick: () => setShowCreateDialog(true) }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Residents</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits?.map((unit) => {
                  const owner = unit.unit_members?.find((m: any) => m.member_type === 'owner' && m.is_primary);
                  return (
                    <TableRow key={unit.id}>
                      <TableCell>
                        <Link 
                          to={`/members/${unit.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {unit.unit_number}
                        </Link>
                        {unit.address && (
                          <p className="text-sm text-muted-foreground">{unit.address}</p>
                        )}
                      </TableCell>
                      <TableCell>{getOwnerName(unit)}</TableCell>
                      <TableCell>
                        {owner?.profile?.email && (
                          <p className="text-sm">{owner.profile.email}</p>
                        )}
                        {owner?.profile?.phone && (
                          <p className="text-sm text-muted-foreground">{owner.profile.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {getResidentCount(unit) > 0 ? (
                          <Badge variant="outline">{getResidentCount(unit)} resident(s)</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={unit.balance_due && unit.balance_due > 0 ? 'font-medium text-destructive' : ''}>
                          {formatCurrency(unit.balance_due || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={unit.status === 'active' ? 'default' : 'secondary'}
                          className={unit.status === 'active' ? 'bg-success' : ''}
                        >
                          {unit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateUnitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
