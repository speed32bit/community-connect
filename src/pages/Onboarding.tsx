import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [hoaName, setHoaName] = useState('');
  const [hoaAddress, setHoaAddress] = useState('');
  const [hoaCity, setHoaCity] = useState('');
  const [hoaState, setHoaState] = useState('');
  const [hoaZip, setHoaZip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleCreateHOA = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setIsLoading(true);

    try {
      // Generate HOA ID client-side
      const hoaId = crypto.randomUUID();
      
      // First, create the HOA (without SELECT to avoid RLS issue)
      const { error: hoaError } = await supabase
        .from('hoas')
        .insert({
          id: hoaId,
          name: hoaName,
          address: hoaAddress,
          city: hoaCity,
          state: hoaState,
          zip_code: hoaZip,
        });

      if (hoaError) throw hoaError;

      // Now create the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          hoa_id: hoaId,
          role: 'board_admin',
        });

      if (roleError) {
        // Note: Can't easily rollback HOA due to RLS, but this is rare
        throw roleError;
      }

      // Create default deposit account
      await supabase.from('deposit_accounts').insert({
        hoa_id: hoaId,
        name: 'Operating Account',
        is_default: true,
      });

      // Create default invoice categories
      await supabase.from('invoice_categories').insert([
        { hoa_id: hoaId, name: 'HOA Dues', is_default: true },
        { hoa_id: hoaId, name: 'Special Assessment', is_default: false },
        { hoa_id: hoaId, name: 'Late Fee', is_default: false },
        { hoa_id: hoaId, name: 'Other', is_default: false },
      ]);

      // Create default transaction categories
      await supabase.from('transaction_categories').insert([
        { hoa_id: hoaId, name: 'HOA Dues', type: 'income' },
        { hoa_id: hoaId, name: 'Special Assessment', type: 'income' },
        { hoa_id: hoaId, name: 'Interest', type: 'income' },
        { hoa_id: hoaId, name: 'Other Income', type: 'income' },
        { hoa_id: hoaId, name: 'Maintenance', type: 'expense' },
        { hoa_id: hoaId, name: 'Utilities', type: 'expense' },
        { hoa_id: hoaId, name: 'Insurance', type: 'expense' },
        { hoa_id: hoaId, name: 'Legal', type: 'expense' },
        { hoa_id: hoaId, name: 'Administrative', type: 'expense' },
        { hoa_id: hoaId, name: 'Other Expense', type: 'expense' },
      ]);

      await refreshProfile();
      toast.success('HOA created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Failed to create HOA: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Set up your HOA</CardTitle>
          <CardDescription>
            Let's get your homeowners association set up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hoaName">HOA Name *</Label>
                <Input
                  id="hoaName"
                  placeholder="Sunset Valley HOA"
                  value={hoaName}
                  onChange={(e) => setHoaName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoaAddress">Street Address</Label>
                <Input
                  id="hoaAddress"
                  placeholder="123 Main Street"
                  value={hoaAddress}
                  onChange={(e) => setHoaAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hoaCity">City</Label>
                  <Input
                    id="hoaCity"
                    placeholder="Anytown"
                    value={hoaCity}
                    onChange={(e) => setHoaCity(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="hoaState">State</Label>
                    <Input
                      id="hoaState"
                      placeholder="CA"
                      value={hoaState}
                      onChange={(e) => setHoaState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoaZip">ZIP</Label>
                    <Input
                      id="hoaZip"
                      placeholder="12345"
                      value={hoaZip}
                      onChange={(e) => setHoaZip(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={handleCreateHOA}
                disabled={!hoaName || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create HOA & Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
