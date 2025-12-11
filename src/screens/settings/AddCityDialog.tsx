import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { addDomesticCity } from '@/utilities/api/config.api';

// List of Libyan cities
const LIBYAN_CITIES = [
  'tripoli',
  'benghazi',
  'misrata',
  'al_bayda',
  'zawiya',
  'zliten',
  'ajdabiya',
  'tobruk',
  'sirte',
  'al_khums',
  'derna',
  'sabha',
  'gharyan',
  'tarhuna',
  'bani_walid',
  'al_marj',
  'zintan',
  'nalut',
  'ghadames',
  'al_jufra',
  'ubari',
  'murzuq',
  'ghat',
  'kufra',
  'al_jawf',
  'yafran',
  'jadu',
  'kabaw',
  'msallata',
  'brega',
  'ras_lanuf',
  'suluq',
];

const formatCityLabel = (city: string): string => {
  return city
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const addCitySchema = z.object({
  cityName: z.string().min(1, 'Please select a city'),
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
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  // Filter out already existing cities
  const availableCities = useMemo(() => {
    return LIBYAN_CITIES.filter(city => !existingCities.includes(city));
  }, [existingCities]);

  const onSubmit = async (data: AddCityFormData) => {
    if (existingCities.includes(data.cityName)) {
      form.setError('cityName', {
        type: 'manual',
        message: t('settings.domesticCities.cityExists'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDomesticCity(data.cityName, {
        A: data.A,
        B: data.B,
        C: data.C,
        D: data.D,
        E: data.E,
      });
      
      toast.success(t('common.success'), {
        description: t('settings.domesticCities.cityAdded', { city: formatCityLabel(data.cityName) }),
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
      setPopoverOpen(false);
    }
    onOpenChange(open);
  };

  const tierLabels = ['A', 'B', 'C', 'D', 'E'] as const;

  const selectedCity = form.watch('cityName');

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
            <Label>{t('settings.domesticCities.cityName')}</Label>
            <Controller
              name="cityName"
              control={form.control}
              render={({ field }) => (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between bg-background hover:bg-accent"
                      disabled={isSubmitting}
                      type="button"
                    >
                      {field.value ? (
                        <span className="truncate">{formatCityLabel(field.value)}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t('settings.domesticCities.selectCity')}
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-border z-50 bg-popover" align="start">
                    <Command className="bg-popover">
                      <CommandInput placeholder={t('settings.domesticCities.searchCities')} />
                      <CommandList>
                        <CommandEmpty>{t('settings.domesticCities.noCityFound')}</CommandEmpty>
                        <CommandGroup>
                          {availableCities.map((city) => (
                            <CommandItem
                              key={city}
                              value={formatCityLabel(city)}
                              onSelect={() => {
                                field.onChange(city);
                                setPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === city ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {formatCityLabel(city)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
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
