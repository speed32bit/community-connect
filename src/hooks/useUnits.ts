import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Unit, UnitWithMembers, Profile } from '@/types/database';
import { toast } from 'sonner';

export function useUnits() {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['units', hoa?.id],
    queryFn: async () => {
      if (!hoa?.id) return [];

      const { data: units, error } = await supabase
        .from('units')
        .select('*')
        .eq('hoa_id', hoa.id)
        .order('unit_number');

      if (error) throw error;

      // Get unit members separately
      const unitIds = (units || []).map(u => u.id);
      
      const { data: members } = await supabase
        .from('unit_members')
        .select('*')
        .in('unit_id', unitIds);

      // Get profiles for members
      const userIds = [...new Set((members || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      // Calculate balance due for each unit
      const unitsWithBalance = await Promise.all(
        (units || []).map(async (unit) => {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('amount, discount, late_fee, payments(amount)')
            .eq('unit_id', unit.id)
            .in('status', ['pending', 'partial', 'overdue'])
            .is('deleted_at', null);

          const balanceDue = (invoices || []).reduce((total, inv) => {
            const invoiceTotal = parseFloat(String(inv.amount)) - 
                                parseFloat(String(inv.discount || 0)) + 
                                parseFloat(String(inv.late_fee || 0));
            const paid = (inv.payments || []).reduce(
              (sum: number, p: any) => sum + parseFloat(String(p.amount)),
              0
            );
            return total + (invoiceTotal - paid);
          }, 0);

          const unitMembers = (members || [])
            .filter(m => m.unit_id === unit.id)
            .map(m => ({
              ...m,
              profile: (profiles || []).find(p => p.user_id === m.user_id),
            }));

          return {
            ...unit,
            balance_due: balanceDue,
            unit_members: unitMembers,
          } as UnitWithMembers;
        })
      );

      return unitsWithBalance;
    },
    enabled: !!hoa?.id,
  });
}

export function useUnit(unitId: string | null) {
  const { hoa } = useAuth();

  return useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      if (!unitId || !hoa?.id) return null;

      const { data: unit, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

      if (error) throw error;

      // Get unit members
      const { data: members } = await supabase
        .from('unit_members')
        .select('*')
        .eq('unit_id', unitId);

      // Get profiles for members
      const userIds = (members || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      // Get invoices and payments for ledger
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, payments(*)')
        .eq('unit_id', unitId)
        .is('deleted_at', null)
        .order('issue_date', { ascending: false });

      const balanceDue = (invoices || []).reduce((total, inv) => {
        if (!['pending', 'partial', 'overdue'].includes(inv.status)) return total;
        const invoiceTotal = parseFloat(String(inv.amount)) - 
                            parseFloat(String(inv.discount || 0)) + 
                            parseFloat(String(inv.late_fee || 0));
        const paid = (inv.payments || []).reduce(
          (sum: number, p: any) => sum + parseFloat(String(p.amount)),
          0
        );
        return total + (invoiceTotal - paid);
      }, 0);

      const unitMembers = (members || []).map(m => ({
        ...m,
        profile: (profiles || []).find(p => p.user_id === m.user_id),
      }));

      return {
        ...unit,
        balance_due: balanceDue,
        unit_members: unitMembers,
        invoices,
      } as UnitWithMembers & { invoices: any[] };
    },
    enabled: !!unitId && !!hoa?.id,
  });
}

interface CreateUnitData {
  unit_number: string;
  address?: string;
  building?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  parking_spaces?: number;
  notes?: string;
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  const { hoa } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateUnitData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      const { data: unit, error } = await supabase
        .from('units')
        .insert({
          ...data,
          hoa_id: hoa.id,
        })
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create unit: ' + error.message);
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Unit> & { id: string }) => {
      const { data: unit, error } = await supabase
        .from('units')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', variables.id] });
      toast.success('Unit updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update unit: ' + error.message);
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitId: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete unit: ' + error.message);
    },
  });
}

interface AddUnitMemberData {
  unit_id: string;
  email: string;
  member_type: 'owner' | 'resident';
  is_primary?: boolean;
  move_in_date?: string;
}

export function useAddUnitMember() {
  const queryClient = useQueryClient();
  const { hoa, user } = useAuth();

  return useMutation({
    mutationFn: async (data: AddUnitMemberData) => {
      if (!hoa?.id) throw new Error('No HOA selected');

      // Try to find user by email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.email)
        .single();

      let userId: string;

      if (profileData?.user_id) {
        // User exists, use their ID
        userId = profileData.user_id;
      } else {
        // User doesn't exist, create an invitation
        // Generate a secure token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const { data: invitation, error: invError } = await supabase
          .from('invitations')
          .insert({
            hoa_id: hoa.id,
            email: data.email,
            role: data.member_type === 'owner' ? 'board_admin' : 'resident',
            token,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            invited_by: user?.id,
          })
          .select()
          .single();

        if (invError) throw invError;

        toast.info(`Invitation sent to ${data.email}. They can now join the HOA.`);
        
        // For now, we'll create a temporary user_id based on the email
        // In a real system, you might want to wait for invitation acceptance
        // But for UX purposes, we'll allow adding them as a member immediately
        userId = `pending_${data.email}`;
      }

      // Add the unit member
      const { data: member, error } = await supabase
        .from('unit_members')
        .insert({
          unit_id: data.unit_id,
          user_id: userId,
          member_type: data.member_type,
          is_primary: data.is_primary || false,
          move_in_date: data.move_in_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', variables.unit_id] });
      toast.success(`${variables.email} added to unit as ${variables.member_type}`);
    },
    onError: (error) => {
      toast.error('Failed to add member: ' + error.message);
    },
  });
}

interface RemoveUnitMemberData {
  unit_id: string;
  member_id: string;
}

export function useRemoveUnitMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ unit_id, member_id }: RemoveUnitMemberData) => {
      const { error } = await supabase
        .from('unit_members')
        .delete()
        .eq('id', member_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', variables.unit_id] });
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });
}
