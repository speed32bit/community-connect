import { useState } from 'react';
import { AlertTriangle, Phone, Mail, FileText, Plus } from 'lucide-react';
import { useDelinquentUnits, useCollectionActions, useCreateCollectionAction, CollectionActionType } from '@/hooks/useCollections';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';

const ACTION_TYPES: { value: CollectionActionType; label: string }[] = [
  { value: 'reminder_email', label: 'Reminder Email' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'formal_notice', label: 'Formal Notice' },
  { value: 'legal_action', label: 'Legal Action' },
  { value: 'payment_plan', label: 'Payment Plan' },
  { value: 'other', label: 'Other' },
];

export default function Collections() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newAction, setNewAction] = useState({
    unit_id: '',
    action_type: 'reminder_email' as CollectionActionType,
    completed_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: delinquentUnits, isLoading } = useDelinquentUnits();
  const { data: actions } = useCollectionActions(selectedUnitId || undefined);
  const createAction = useCreateCollectionAction();

  const getAgingBadge = (days: number) => {
    if (days <= 30) return <Badge variant="outline" className="bg-warning/10 text-warning">1-30 days</Badge>;
    if (days <= 60) return <Badge variant="outline" className="bg-warning/20 text-warning">31-60 days</Badge>;
    if (days <= 90) return <Badge variant="outline" className="bg-destructive/10 text-destructive">61-90 days</Badge>;
    return <Badge variant="destructive">90+ days</Badge>;
  };

  const handleRecordAction = (unitId: string) => {
    setNewAction({ ...newAction, unit_id: unitId });
    setShowActionDialog(true);
  };

  const handleCreate = async () => {
    await createAction.mutateAsync(newAction);
    setShowActionDialog(false);
    setNewAction({
      unit_id: '',
      action_type: 'reminder_email',
      completed_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Manage delinquent accounts and collection activities"
      />

      <Card>
        <CardHeader>
          <CardTitle>Delinquent Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading accounts...</p>
            </div>
          ) : delinquentUnits?.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No delinquent accounts"
              description="All accounts are current. Great job!"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delinquentUnits?.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unit_number}</TableCell>
                    <TableCell>{unit.owner_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(unit.balance_due)}
                    </TableCell>
                    <TableCell>{getAgingBadge(unit.days_past_due)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" title="Send Reminder">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Log Call">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRecordAction(unit.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Log Action
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {actions && actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Collection Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.slice(0, 10).map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>{new Date(action.completed_date || action.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{action.unit?.unit_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ACTION_TYPES.find(t => t.value === action.action_type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {action.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Collection Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={newAction.action_type}
                onValueChange={(value: CollectionActionType) => 
                  setNewAction({ ...newAction, action_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newAction.completed_date}
                onChange={(e) => setNewAction({ ...newAction, completed_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter notes about this action..."
                value={newAction.notes}
                onChange={(e) => setNewAction({ ...newAction, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createAction.isPending}>
              {createAction.isPending ? 'Saving...' : 'Save Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
