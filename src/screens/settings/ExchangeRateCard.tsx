import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Loader2, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { updateExchangeRate } from '@/utilities/api/config.api';

const exchangeRateSchema = z.object({
  lydExchangeRate: z.coerce
    .number()
    .min(0.01, 'Exchange rate must be greater than 0')
    .max(1000, 'Exchange rate must be less than 1000'),
});

type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;

interface ExchangeRateCardProps {
  lydExchangeRate: number;
  onUpdate: () => void;
}

export function ExchangeRateCard({ lydExchangeRate, onUpdate }: ExchangeRateCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ExchangeRateFormData>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: { lydExchangeRate },
  });

  useEffect(() => {
    reset({ lydExchangeRate });
  }, [lydExchangeRate, reset]);

  const onSubmit = async (data: ExchangeRateFormData) => {
    setIsSaving(true);
    try {
      await updateExchangeRate(data.lydExchangeRate);
      toast({
        title: 'Success',
        description: 'Exchange rate updated successfully',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update exchange rate',
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
      <Card className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">LYD Exchange Rate</h3>
            <p className="text-sm text-muted-foreground">Configure the Libyan Dinar exchange rate</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="lydExchangeRate" className="flex flex-col gap-0.5">
              <span className="font-semibold">Exchange Rate</span>
              <span className="text-xs text-muted-foreground font-normal">
                1 USD = X LYD
              </span>
            </Label>
            <Input
              id="lydExchangeRate"
              type="number"
              step="0.01"
              {...register('lydExchangeRate')}
              className={`pointer-events-auto ${errors.lydExchangeRate ? 'border-destructive' : ''}`}
              placeholder="6.95"
            />
            {errors.lydExchangeRate && (
              <p className="text-xs text-destructive">{errors.lydExchangeRate?.message}</p>
            )}
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
