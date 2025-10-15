import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Loader2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { updateDomesticTiers, type DomesticTiers } from '@/utilities/api/config.api';

const domesticTiersSchema = z.object({
  A: z.coerce.number().min(0, 'Must be positive').max(100, 'Must be less than 100'),
  B: z.coerce.number().min(0, 'Must be positive').max(100, 'Must be less than 100'),
  C: z.coerce.number().min(0, 'Must be positive').max(100, 'Must be less than 100'),
  D: z.coerce.number().min(0, 'Must be positive').max(100, 'Must be less than 100'),
  E: z.coerce.number().min(0, 'Must be positive').max(100, 'Must be less than 100'),
});

type DomesticTiersFormData = z.infer<typeof domesticTiersSchema>;

interface DomesticTiersCardProps {
  tiers: DomesticTiers;
  onUpdate: () => void;
}

export function DomesticTiersCard({ tiers, onUpdate }: DomesticTiersCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<DomesticTiersFormData>({
    resolver: zodResolver(domesticTiersSchema),
    defaultValues: tiers,
  });

  useEffect(() => {
    reset(tiers);
  }, [tiers, reset]);

  const onSubmit = async (data: DomesticTiersFormData) => {
    setIsSaving(true);
    try {
      // Ensure all values are present
      const tiersData: DomesticTiers = {
        A: data.A,
        B: data.B,
        C: data.C,
        D: data.D,
        E: data.E,
      };
      await updateDomesticTiers(tiersData);
      toast({
        title: 'Success',
        description: 'Domestic tiers updated successfully',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update domestic tiers',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tierLabels = {
    A: { label: 'Tier A', description: 'Base rate' },
    B: { label: 'Tier B', description: 'Standard' },
    C: { label: 'Tier C', description: 'Medium' },
    D: { label: 'Tier D', description: 'High' },
    E: { label: 'Tier E', description: 'Premium' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Domestic Shipping Tiers</h3>
            <p className="text-sm text-muted-foreground">Configure pricing multipliers for domestic shipments</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(Object.keys(tierLabels) as Array<keyof typeof tierLabels>).map((tier) => (
              <div key={tier} className="space-y-2">
                <Label htmlFor={`tier-${tier}`} className="flex flex-col gap-0.5">
                  <span className="font-semibold">{tierLabels[tier].label}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {tierLabels[tier].description}
                  </span>
                </Label>
                <Input
                  id={`tier-${tier}`}
                  type="number"
                  step="0.1"
                  {...register(tier)}
                  className={`pointer-events-auto ${errors[tier] ? 'border-destructive' : ''}`}
                  placeholder="0.0"
                />
                {errors[tier] && (
                  <p className="text-xs text-destructive">{errors[tier]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
