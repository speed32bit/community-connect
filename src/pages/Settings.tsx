import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, DollarSign, Bell, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateHOA } from '@/hooks/useSettings';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DuesFrequency } from '@/types/database';

export default function Settings() {
  const { hoa, isBoardAdmin } = useAuth();
  const updateHOA = useUpdateHOA();

  const [hoaSettings, setHoaSettings] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
  });

  const [duesSettings, setDuesSettings] = useState({
    dues_amount: 0,
    dues_frequency: 'monthly' as DuesFrequency,
    late_fee_amount: 0,
    late_fee_percentage: 0,
    grace_period_days: 15,
  });

  useEffect(() => {
    if (hoa) {
      setHoaSettings({
        name: hoa.name || '',
        address: hoa.address || '',
        city: hoa.city || '',
        state: hoa.state || '',
        zip_code: hoa.zip_code || '',
        phone: hoa.phone || '',
        email: hoa.email || '',
      });
      setDuesSettings({
        dues_amount: Number(hoa.dues_amount) || 0,
        dues_frequency: (hoa.dues_frequency as DuesFrequency) || 'monthly',
        late_fee_amount: Number(hoa.late_fee_amount) || 0,
        late_fee_percentage: Number(hoa.late_fee_percentage) || 0,
        grace_period_days: hoa.grace_period_days || 15,
      });
    }
  }, [hoa]);

  const handleSaveProfile = async () => {
    await updateHOA.mutateAsync(hoaSettings);
  };

  const handleSaveDues = async () => {
    await updateHOA.mutateAsync(duesSettings);
  };

  if (!isBoardAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You don't have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage HOA configuration and preferences"
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Building2 className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="dues" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Dues & Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>HOA Profile</CardTitle>
              <CardDescription>Basic information about your homeowners association</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>HOA Name</Label>
                <Input
                  value={hoaSettings.name}
                  onChange={(e) => setHoaSettings({ ...hoaSettings, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={hoaSettings.address}
                  onChange={(e) => setHoaSettings({ ...hoaSettings, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={hoaSettings.city}
                    onChange={(e) => setHoaSettings({ ...hoaSettings, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={hoaSettings.state}
                    onChange={(e) => setHoaSettings({ ...hoaSettings, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={hoaSettings.zip_code}
                    onChange={(e) => setHoaSettings({ ...hoaSettings, zip_code: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={hoaSettings.phone}
                    onChange={(e) => setHoaSettings({ ...hoaSettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={hoaSettings.email}
                    onChange={(e) => setHoaSettings({ ...hoaSettings, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveProfile} disabled={updateHOA.isPending}>
                  {updateHOA.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dues">
          <Card>
            <CardHeader>
              <CardTitle>Dues & Late Fees</CardTitle>
              <CardDescription>Configure assessment amounts and late fee policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Regular Dues Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={duesSettings.dues_amount}
                    onChange={(e) => setDuesSettings({ ...duesSettings, dues_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dues Frequency</Label>
                  <Select
                    value={duesSettings.dues_frequency}
                    onValueChange={(value: DuesFrequency) => 
                      setDuesSettings({ ...duesSettings, dues_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Grace Period (Days)</Label>
                <Input
                  type="number"
                  value={duesSettings.grace_period_days}
                  onChange={(e) => setDuesSettings({ ...duesSettings, grace_period_days: parseInt(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">
                  Number of days after due date before late fees apply
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Late Fee (Fixed Amount)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={duesSettings.late_fee_amount}
                    onChange={(e) => setDuesSettings({ ...duesSettings, late_fee_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Late Fee (Percentage)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={duesSettings.late_fee_percentage}
                    onChange={(e) => setDuesSettings({ ...duesSettings, late_fee_percentage: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-muted-foreground">% of invoice amount</p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveDues} disabled={updateHOA.isPending}>
                  {updateHOA.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
