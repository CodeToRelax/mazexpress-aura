import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CitySearchCombobox } from '@/components/ui/CitySearchCombobox';
import { getAvailableCities } from '@/data/libyanCities';

import { addOriginCity } from '@/utilities/api/config.api';

const routeSchema = z.object({
  destinationCity: z.string().min(1, 'Destination city is required'),
  price: z.coerce.number().min(0, 'Price must be at least 0'),
});

const formSchema = z.object({
  originCity: z.string().min(1, 'Origin city is required'),
  routes: z.array(routeSchema).min(1, 'At least one destination is required'),
}).refine((data) => {
  const destinationCities = data.routes.map(r => r.destinationCity.toLowerCase());
  const originLower = data.originCity.toLowerCase();
  return !destinationCities.includes(originLower);
}, {
  message: 'Origin and destination cannot be the same',
  path: ['routes'],
}).refine((data) => {
  const destinationCities = data.routes.map(r => r.destinationCity.toLowerCase());
  return new Set(destinationCities).size === destinationCities.length;
}, {
  message: 'Destination cities must be unique',
  path: ['routes'],
});

type FormData = z.infer<typeof formSchema>;

interface AddOriginCityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingOriginCities: string[];
}

export function AddOriginCityDialog({
  open,
  onOpenChange,
  onSuccess,
  existingOriginCities,
}: AddOriginCityDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originCity: '',
      routes: [{ destinationCity: '', price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'routes',
  });

  const originCity = form.watch('originCity');
  const routes = form.watch('routes');

  // Get available cities for origin (exclude existing origins)
  const availableOriginCities = getAvailableCities(existingOriginCities);

  // Get available cities for destinations (exclude origin and already selected destinations)
  const getAvailableDestinationCities = (currentIndex: number) => {
    const selectedDestinations = routes
      .map((r, i) => i !== currentIndex ? r.destinationCity : '')
      .filter(Boolean);
    const excludeCities = [...selectedDestinations, originCity].filter(Boolean);
    return getAvailableCities(excludeCities);
  };

  const onSubmit = async (data: FormData) => {
    // Check if origin city already exists
    if (existingOriginCities.some(c => c.toLowerCase() === data.originCity.toLowerCase())) {
      form.setError('originCity', { message: t('settings.domesticRoutes.cityExists') });
      return;
    }

    setIsSubmitting(true);
    try {
      const routes: Record<string, number> = {};
      data.routes.forEach(route => {
        routes[route.destinationCity.toLowerCase()] = route.price;
      });

      await addOriginCity(data.originCity.toLowerCase(), routes);
      toast.success(t('common.success'), {
        description: t('settings.domesticRoutes.originCityAdded'),
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticRoutes.addFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.domesticRoutes.addOriginCity')}</DialogTitle>
          <DialogDescription>
            {t('settings.domesticRoutes.addOriginCityDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="originCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.domesticRoutes.originCity')}</FormLabel>
                  <FormControl>
                    <CitySearchCombobox
                      cities={availableOriginCities}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('settings.domesticRoutes.enterCityName')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>{t('settings.domesticRoutes.destinations')}</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`routes.${index}.destinationCity`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <CitySearchCombobox
                            cities={getAvailableDestinationCities(index)}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('settings.domesticRoutes.destinationCity')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`routes.${index}.price`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="LYD"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ destinationCity: '', price: 0 })}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('settings.domesticRoutes.addDestination')}
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
