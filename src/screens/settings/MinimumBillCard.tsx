import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Loader2, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getMinimumBill, updateMinimumBill } from '@/utilities/api/config.api';

const minimumBillSchema = z.object({
  minimumBillLyd: z.coerce
    .number({ invalid_type_error: 'Minimum bill must be a number' })
    .min(0, 'Minimum bill cannot be negative')
    .max(100000, 'Minimum bill is too large'),
});

type MinimumBillFormData = z.infer<typeof minimumBillSchema>;

export function MinimumBillCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<MinimumBillFormData>({
    resolver: zodResolver(minimumBillSchema),
    defaultValues: { minimumBillLyd: 0 },
  });

  const fetchValue = async () => {
    try {
      const value = await getMinimumBill();
      reset({ minimumBillLyd: value });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to load minimum bill',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: MinimumBillFormData) => {
    setIsSaving(true);
    try {
      const updated = await updateMinimumBill(data.minimumBillLyd);
      reset({ minimumBillLyd: updated });
      toast({
        title: 'Success',
        description: 'Minimum bill updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update minimum bill',
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
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Minimum Bill</h3>
            <p className="text-sm text-muted-foreground">
              Invoices below this total are raised to this amount
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="minimumBillLyd" className="flex flex-col gap-0.5">
              <span className="font-semibold">Minimum Invoice Total</span>
              <span className="text-xs text-muted-foreground font-normal">
                Amount in LYD
              </span>
            </Label>
            <Input
              id="minimumBillLyd"
              type="number"
              step="0.01"
              min="0"
              disabled={isLoading}
              {...register('minimumBillLyd')}
              className={`pointer-events-auto ${
                errors.minimumBillLyd ? 'border-destructive' : ''
              }`}
              placeholder="40"
            />
            {errors.minimumBillLyd && (
              <p className="text-xs text-destructive">
                {errors.minimumBillLyd?.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving || isLoading || !isDirty}>
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