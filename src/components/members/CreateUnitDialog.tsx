import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateUnit } from '@/hooks/useUnits';

const unitSchema = z.object({
  unit_number: z.string().min(1, 'Unit number is required'),
  address: z.string().optional(),
  building: z.string().optional(),
  floor: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  square_feet: z.number().optional(),
  parking_spaces: z.number().optional(),
  notes: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUnitDialog({ open, onOpenChange }: CreateUnitDialogProps) {
  const createUnit = useCreateUnit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
  });

  const onSubmit = (data: UnitFormData) => {
    createUnit.mutate({
      unit_number: data.unit_number,
      address: data.address,
      building: data.building,
      floor: data.floor,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      square_feet: data.square_feet,
      parking_spaces: data.parking_spaces,
      notes: data.notes,
    }, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Unit</DialogTitle>
          <DialogDescription>
            Add a new unit to your HOA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">Unit Number *</Label>
              <Input
                id="unit_number"
                placeholder="101"
                {...register('unit_number')}
              />
              {errors.unit_number && (
                <p className="text-sm text-destructive">{errors.unit_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                placeholder="A"
                {...register('building')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              {...register('address')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                {...register('floor', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                {...register('bedrooms', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                step="0.5"
                {...register('bathrooms', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="square_feet">Square Feet</Label>
              <Input
                id="square_feet"
                type="number"
                {...register('square_feet', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parking_spaces">Parking Spaces</Label>
              <Input
                id="parking_spaces"
                type="number"
                {...register('parking_spaces', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUnit.isPending}>
              {createUnit.isPending ? 'Creating...' : 'Create Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
