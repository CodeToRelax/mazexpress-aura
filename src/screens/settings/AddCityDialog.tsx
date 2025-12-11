import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
import { addDomesticCity } from '@/utilities/api/config.api';

const addCitySchema = z.object({
  cityName: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name must be less than 50 characters')
    .regex(/^[a-zA-Z\s_]+$/, 'City name can only contain letters, spaces, and underscores'),
  A: z.coerce.number().min(0, 'Must be at least 0'),
  B: z.coerce.number().min(0, 'Must be at least 0'),
  C: z.coerce.number().min(0, 'Must be at least 0'),
  D: z.coerce.number().min(0, 'Must be at least 0'),
  E: z.coerce.number().min(0, 'Must be at least 0'),
});

type AddCityFormData = z.infer<typeof addCitySchema>;

interface AddCityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingCities: string[];
}

export function AddCityDialog({ open, onOpenChange, onSuccess, existingCities }: AddCityDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddCityFormData>({
    resolver: zodResolver(addCitySchema),
    defaultValues: {
      cityName: '',
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
    },
  });

  const onSubmit = async (data: AddCityFormData) => {
    const normalizedCity = data.cityName.toLowerCase().replace(/\s+/g, '_');
    
    if (existingCities.includes(normalizedCity)) {
      form.setError('cityName', {
        type: 'manual',
        message: t('settings.domesticCities.cityExists'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDomesticCity(normalizedCity, {
        A: data.A,
        B: data.B,
        C: data.C,
        D: data.D,
        E: data.E,
      });
      
      toast.success(t('common.success'), {
        description: t('settings.domesticCities.cityAdded', { city: data.cityName }),
      });
      
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticCities.addFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  const tierLabels = ['A', 'B', 'C', 'D', 'E'] as const;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.domesticCities.addCityTitle')}</DialogTitle>
          <DialogDescription>
            {t('settings.domesticCities.addCityDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cityName">{t('settings.domesticCities.cityName')}</Label>
            <Input
              id="cityName"
              placeholder={t('settings.domesticCities.cityNamePlaceholder')}
              {...form.register('cityName')}
            />
            {form.formState.errors.cityName && (
              <p className="text-sm text-destructive">{form.formState.errors.cityName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('settings.domesticCities.tiers')}</Label>
            <div className="grid grid-cols-5 gap-2">
              {tierLabels.map((tier) => (
                <div key={tier} className="space-y-1">
                  <Label htmlFor={`add-tier-${tier}`} className="text-xs text-muted-foreground">
                    {tier}
                  </Label>
                  <Input
                    id={`add-tier-${tier}`}
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register(tier)}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.domesticCities.addCity')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
