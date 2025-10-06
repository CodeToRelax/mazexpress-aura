import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { updateCountryConfig } from '@/utilities/api/config.api';

const countryConfigSchema = z.object({
  seaShippingRate: z.coerce.number().min(0, 'Must be positive'),
  airShippingRate: z.coerce.number().min(0, 'Must be positive'),
  seaShippingFactor: z.coerce.number().min(0, 'Must be positive'),
  airShippingFactor: z.coerce.number().min(0, 'Must be positive'),
});

type CountryConfigFormData = z.infer<typeof countryConfigSchema>;

interface CountryConfigCardProps {
  country: string;
  displayName: string;
  config: CountryConfigFormData;
  onUpdate: () => void;
}

export function CountryConfigCard({ country, displayName, config, onUpdate }: CountryConfigCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<CountryConfigFormData>({
    resolver: zodResolver(countryConfigSchema),
    defaultValues: config,
  });

  useEffect(() => {
    reset(config);
  }, [config, reset]);

  const onSubmit = async (data: CountryConfigFormData) => {
    setIsSaving(true);
    try {
      await updateCountryConfig(country, data);
      toast({
        title: 'Success',
        description: `${displayName} configuration updated successfully`,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">{displayName}</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${country}-seaRate`}>Sea Shipping Rate</Label>
              <Input
                id={`${country}-seaRate`}
                type="number"
                step="0.01"
                {...register('seaShippingRate')}
                className={errors.seaShippingRate ? 'border-destructive' : ''}
              />
              {errors.seaShippingRate && (
                <p className="text-sm text-destructive">{errors.seaShippingRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${country}-airRate`}>Air Shipping Rate</Label>
              <Input
                id={`${country}-airRate`}
                type="number"
                step="0.01"
                {...register('airShippingRate')}
                className={errors.airShippingRate ? 'border-destructive' : ''}
              />
              {errors.airShippingRate && (
                <p className="text-sm text-destructive">{errors.airShippingRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${country}-seaFactor`}>Sea Shipping Factor</Label>
              <Input
                id={`${country}-seaFactor`}
                type="number"
                step="1"
                {...register('seaShippingFactor')}
                className={errors.seaShippingFactor ? 'border-destructive' : ''}
              />
              {errors.seaShippingFactor && (
                <p className="text-sm text-destructive">{errors.seaShippingFactor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${country}-airFactor`}>Air Shipping Factor</Label>
              <Input
                id={`${country}-airFactor`}
                type="number"
                step="1"
                {...register('airShippingFactor')}
                className={errors.airShippingFactor ? 'border-destructive' : ''}
              />
              {errors.airShippingFactor && (
                <p className="text-sm text-destructive">{errors.airShippingFactor.message}</p>
              )}
            </div>
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
