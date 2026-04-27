import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CityCombobox } from '@/components/domestic/CityCombobox';
import { routeSchema, type RouteFormValues } from '@/utilities/zod/domestic.schemas';
import { createRoute, updateRoute } from '@/utilities/api/routes.api';
import { RouteDuplicateError, type Route, type RouteCreateBody } from '@/types/domestic';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** when set, drawer is in edit mode */
  route?: Route | null;
}

export function RouteFormDrawer({ open, onOpenChange, route }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!route;

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      originCity: '',
      destinationCity: '',
      priceTierA: 0,
      priceTierB: 0,
      priceTierC: 0,
      priceTierD: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (route) {
        form.reset({
          originCity: route.originCity,
          destinationCity: route.destinationCity,
          priceTierA: route.priceTierA,
          priceTierB: route.priceTierB,
          priceTierC: route.priceTierC,
          priceTierD: route.priceTierD,
        });
      } else {
        form.reset({
          originCity: '',
          destinationCity: '',
          priceTierA: 0,
          priceTierB: 0,
          priceTierC: 0,
          priceTierD: 0,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, route]);

  const mutation = useMutation({
    mutationFn: async (values: RouteFormValues) => {
      const body: RouteCreateBody = {
        originCity: values.originCity,
        destinationCity: values.destinationCity,
        priceTierA: values.priceTierA,
        priceTierB: values.priceTierB,
        priceTierC: values.priceTierC,
        priceTierD: values.priceTierD,
      };
      if (isEdit && route) return updateRoute(route._id, body);
      return createRoute(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Route updated' : 'Route created');
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof RouteDuplicateError) {
        form.setError('destinationCity', {
          message: t(
            'domestic.admin.routes.duplicate-error',
            'A route already exists for this pair.'
          ),
        });
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Save failed');
    },
  });

  const origin = form.watch('originCity');
  const dest = form.watch('destinationCity');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit
              ? t('domestic.admin.routes.edit', 'Edit route')
              : t('domestic.admin.routes.create', 'New route')}
          </SheetTitle>
          <SheetDescription>
            Set tier prices for the origin → destination pair.
          </SheetDescription>
        </SheetHeader>

        <form
          className="space-y-5 mt-6"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="space-y-2">
            <Label>{t('domestic.admin.routes.field.origin', 'Origin city')}</Label>
            <CityCombobox
              value={form.watch('originCity')}
              onChange={(v) => {
                form.setValue('originCity', v, { shouldValidate: true });
                if (form.getValues('destinationCity') === v) {
                  form.setValue('destinationCity', '', { shouldValidate: true });
                }
              }}
              excludeCity={dest as string}
            />
            {form.formState.errors.originCity && (
              <p className="text-sm text-destructive">{form.formState.errors.originCity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('domestic.admin.routes.field.destination', 'Destination city')}</Label>
            <CityCombobox
              value={form.watch('destinationCity')}
              onChange={(v) => form.setValue('destinationCity', v, { shouldValidate: true })}
              excludeCity={origin as string}
            />
            {form.formState.errors.destinationCity && (
              <p className="text-sm text-destructive">
                {form.formState.errors.destinationCity.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((tier) => {
              const key = `priceTier${tier}` as const;
              return (
                <div key={tier} className="space-y-2">
                  <Label>
                    {t(`domestic.admin.routes.field.tier-${tier.toLowerCase()}`, `Tier ${tier} price`)}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      {...form.register(key, { valueAsNumber: true })}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      LYD
                    </span>
                  </div>
                  {form.formState.errors[key] && (
                    <p className="text-sm text-destructive">{form.formState.errors[key]?.message}</p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Routes are one-directional. Price changes apply only to new shipments.
          </p>

          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.formState.isValid}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create route'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}