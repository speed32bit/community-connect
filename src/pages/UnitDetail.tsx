import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus, User, Mail, Phone, Calendar, Home, DollarSign, X } from 'lucide-react';
import { useUnit, useUpdateUnit, useDeleteUnit, useAddUnitMember, useRemoveUnitMember } from '@/hooks/useUnits';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  
  const { data: unit, isLoading } = useUnit(id || null);
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const addMember = useAddUnitMember();
  const removeMember = useRemoveUnitMember();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    unit_number: '',
    address: '',
    building: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    parking_spaces: '',
    notes: '',
  });
  const [addMemberForm, setAddMemberForm] = useState({
    user_id: '',
    member_type: 'resident' as 'owner' | 'resident',
    is_primary: false,
    move_in_date: new Date().toISOString().split('T')[0],
  });

  const handleOpenEdit = () => {
    if (unit) {
      setEditForm({
        unit_number: unit.unit_number || '',
        address: unit.address || '',
        building: unit.building || '',
        floor: unit.floor?.toString() || '',
        bedrooms: unit.bedrooms?.toString() || '',
        bathrooms: unit.bathrooms?.toString() || '',
        square_feet: unit.square_feet?.toString() || '',
        parking_spaces: unit.parking_spaces?.toString() || '',
        notes: unit.notes || '',
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    await updateUnit.mutateAsync({
      id,
      unit_number: editForm.unit_number,
      address: editForm.address || null,
      building: editForm.building || null,
      floor: editForm.floor ? parseInt(editForm.floor) : null,
      bedrooms: editForm.bedrooms ? parseInt(editForm.bedrooms) : null,
      bathrooms: editForm.bathrooms ? parseFloat(editForm.bathrooms) : null,
      square_feet: editForm.square_feet ? parseInt(editForm.square_feet) : null,
      parking_spaces: editForm.parking_spaces ? parseInt(editForm.parking_spaces) : null,
      notes: editForm.notes || null,
    });
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteUnit.mutateAsync(id);
    navigate('/members');
  };

  const handleAddMember = async () => {
    if (!id || !addMemberForm.user_id) return;
    await addMember.mutateAsync({
      unit_id: id,
      user_id: addMemberForm.user_id,
      member_type: addMemberForm.member_type,
      is_primary: addMemberForm.member_type === 'owner' ? addMemberForm.is_primary : false,
      move_in_date: addMemberForm.move_in_date || undefined,
    });
    setShowAddMemberDialog(false);
    setAddMemberForm({
      user_id: '',
      member_type: 'resident',
      is_primary: false,
      move_in_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleRemoveMember = async () => {
    if (!id || !memberToRemove) return;
    await removeMember.mutateAsync({
      unit_id: id,
      member_id: memberToRemove,
    });
    setMemberToRemove(null);
  };

  const getPrimaryOwner = () => {
    return unit?.unit_members?.find(m => m.member_type === 'owner' && m.is_primary);
  };

  const getOtherMembers = () => {
    return unit?.unit_members?.filter(m => !(m.member_type === 'owner' && m.is_primary)) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Unit not found</p>
          <Button onClick={() => navigate('/members')}>Back to Members</Button>
        </div>
      </div>
    );
  }

  const primaryOwner = getPrimaryOwner();
  const otherMembers = getOtherMembers();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Unit ${unit.unit_number}`}
        description={unit.address || 'No address specified'}
        actions={
          isManager && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/members')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={handleOpenEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unit.balance_due > 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(unit.balance_due || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={unit.status === 'active' ? 'default' : 'secondary'}>
              {unit.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unit.unit_members?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {unit.bedrooms ? `${unit.bedrooms} BR` : '-'} 
              {unit.bathrooms ? ` / ${unit.bathrooms} BA` : ''}
              {unit.square_feet ? ` · ${unit.square_feet.toLocaleString()} sqft` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="details">Unit Details</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Unit Members</CardTitle>
                <CardDescription>Owners and residents of this unit</CardDescription>
              </div>
              {isManager && (
                <Button onClick={() => setShowAddMemberDialog(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {primaryOwner ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {primaryOwner.profile?.first_name} {primaryOwner.profile?.last_name}
                          </p>
                          <Badge variant="default">Primary Owner</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {primaryOwner.profile?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {primaryOwner.profile.email}
                            </span>
                          )}
                          {primaryOwner.profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {primaryOwner.profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {otherMembers.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Move In</TableHead>
                          {isManager && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {otherMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.profile?.first_name} {member.profile?.last_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{member.member_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {member.profile?.email && <p>{member.profile.email}</p>}
                                {member.profile?.phone && <p className="text-muted-foreground">{member.profile.phone}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {member.move_in_date ? formatDate(member.move_in_date) : '-'}
                            </TableCell>
                            {isManager && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMemberToRemove(member.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No members assigned to this unit</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>All invoices for this unit</CardDescription>
            </CardHeader>
            <CardContent>
              {unit.invoices?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No invoices for this unit</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unit.invoices?.map((invoice: any) => {
                      const totalDue = parseFloat(invoice.amount) - parseFloat(invoice.discount || 0) + parseFloat(invoice.late_fee || 0);
                      const paid = (invoice.payments || []).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.title}</TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{formatCurrency(totalDue)}</p>
                              {paid > 0 && (
                                <p className="text-xs text-success">Paid: {formatCurrency(paid)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Unit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Building</p>
                  <p className="font-medium">{unit.building || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="font-medium">{unit.floor || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Parking Spaces</p>
                  <p className="font-medium">{unit.parking_spaces || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Square Feet</p>
                  <p className="font-medium">{unit.square_feet?.toLocaleString() || '-'}</p>
                </div>
              </div>
              {unit.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-wrap">{unit.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Number *</Label>
                <Input
                  value={editForm.unit_number}
                  onChange={(e) => setEditForm({ ...editForm, unit_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Building</Label>
                <Input
                  value={editForm.building}
                  onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input
                  type="number"
                  value={editForm.floor}
                  onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  value={editForm.bedrooms}
                  onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={editForm.bathrooms}
                  onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Parking</Label>
                <Input
                  type="number"
                  value={editForm.parking_spaces}
                  onChange={(e) => setEditForm({ ...editForm, parking_spaces: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Square Feet</Label>
              <Input
                type="number"
                value={editForm.square_feet}
                onChange={(e) => setEditForm({ ...editForm, square_feet: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.unit_number || updateUnit.isPending}>
              {updateUnit.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Unit {unit.unit_number}? This will also delete all associated invoices, payments, and member assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Unit {unit?.unit_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Select User/Email *</Label>
              <Input
                id="user_id"
                placeholder="Enter email or user ID"
                value={addMemberForm.user_id}
                onChange={(e) => setAddMemberForm({ ...addMemberForm, user_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">User must be invited to the HOA first</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member_type">Member Type *</Label>
              <Select 
                value={addMemberForm.member_type}
                onValueChange={(value) => setAddMemberForm({ 
                  ...addMemberForm, 
                  member_type: value as 'owner' | 'resident',
                  is_primary: value === 'owner' ? addMemberForm.is_primary : false
                })}
              >
                <SelectTrigger id="member_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addMemberForm.member_type === 'owner' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={addMemberForm.is_primary}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="is_primary" className="font-normal">Primary Owner</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="move_in_date">Move In Date</Label>
              <Input
                id="move_in_date"
                type="date"
                value={addMemberForm.move_in_date}
                onChange={(e) => setAddMemberForm({ ...addMemberForm, move_in_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddMember} 
              disabled={!addMemberForm.user_id || addMember.isPending}
            >
              {addMember.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from Unit {unit?.unit_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
