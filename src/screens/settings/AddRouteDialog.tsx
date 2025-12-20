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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { setRoutePrice } from '@/utilities/api/config.api';

const formSchema = z.object({
  destinationCity: z.string().min(2, 'City name must be at least 2 characters').max(50),
  price: z.coerce.number().min(0, 'Price must be at least 0'),
});

type FormData = z.infer<typeof formSchema>;

interface AddRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  originCity: string;
  existingDestinations: string[];
}

function formatCityName(city: string): string {
  return city
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function AddRouteDialog({
  open,
  onOpenChange,
  onSuccess,
  originCity,
  existingDestinations,
}: AddRouteDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinationCity: '',
      price: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    const destLower = data.destinationCity.toLowerCase();
    
    // Validate not same as origin
    if (destLower === originCity.toLowerCase()) {
      form.setError('destinationCity', { 
        message: t('settings.domesticRoutes.sameCityError') 
      });
      return;
    }

    // Validate not already exists
    if (existingDestinations.some(d => d.toLowerCase() === destLower)) {
      form.setError('destinationCity', { 
        message: t('settings.domesticRoutes.routeExists') 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await setRoutePrice(originCity, destLower, data.price);
      toast.success(t('common.success'), {
        description: t('settings.domesticRoutes.routeAdded'),
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('settings.domesticRoutes.addRoute')}</DialogTitle>
          <DialogDescription>
            {t('settings.domesticRoutes.addRouteDesc', { city: formatCityName(originCity) })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('settings.domesticRoutes.from')}</p>
              <p className="font-medium">{formatCityName(originCity)}</p>
            </div>

            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.domesticRoutes.destinationCity')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('settings.domesticRoutes.enterCityName')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.domesticRoutes.price')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
