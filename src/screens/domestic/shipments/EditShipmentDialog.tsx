import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CityCombobox } from '@/components/domestic/CityCombobox';
import { editShipmentSchema, type EditShipmentFormValues } from '@/utilities/zod/domestic.schemas';
import { updateAdminShipment } from '@/utilities/api/domesticShipments.api';
import type { AdminEditBody, DomesticShipment } from '@/types/domestic';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: DomesticShipment;
}

export function EditShipmentDialog({ open, onOpenChange, shipment }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const form = useForm<EditShipmentFormValues>({
    resolver: zodResolver(editShipmentSchema),
    defaultValues: {
      originCity: shipment.originCity,
      recipient: {
        name: shipment.recipient.name,
        primaryPhone: shipment.recipient.primaryPhone,
        alternatePhone: shipment.recipient.alternatePhone || '',
        city: shipment.recipient.city,
        address: shipment.recipient.address,
      },
      description: shipment.description,
      itemPrice: shipment.itemPrice,
      quantity: shipment.quantity,
      tier: shipment.tier === ('OTHER' as unknown) ? 'D' : shipment.tier,
      shippingPrice: shipment.shippingPrice,
      options: shipment.options ?? {},
      notes: shipment.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        originCity: shipment.originCity,
        recipient: {
          name: shipment.recipient.name,
          primaryPhone: shipment.recipient.primaryPhone,
          alternatePhone: shipment.recipient.alternatePhone || '',
          city: shipment.recipient.city,
          address: shipment.recipient.address,
        },
        description: shipment.description,
        itemPrice: shipment.itemPrice,
        quantity: shipment.quantity,
        tier: shipment.tier === ('OTHER' as unknown) ? 'D' : shipment.tier,
        shippingPrice: shipment.shippingPrice,
        options: shipment.options ?? {},
        notes: shipment.notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shipment._id]);

  const tier = form.watch('tier');
  const originCity = form.watch('originCity');
  const destCity = form.watch('recipient.city');

  // Auto-recalc: when tier/origin/dest change and tier !== D, clear shippingPrice (server recalcs).
  useEffect(() => {
    if (tier !== 'D') {
      const changedRoute =
        originCity !== shipment.originCity ||
        destCity !== shipment.recipient.city ||
        tier !== shipment.tier;
      if (changedRoute) {
        form.setValue('shippingPrice', undefined as unknown as number);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, originCity, destCity]);

  const mutation = useMutation({
    mutationFn: async (values: EditShipmentFormValues) => {
      const body: AdminEditBody = {
        originCity: values.originCity,
        recipient: {
          name: values.recipient.name,
          primaryPhone: values.recipient.primaryPhone,
          alternatePhone: values.recipient.alternatePhone || null,
          city: values.recipient.city,
          address: values.recipient.address,
        },
        description: values.description,
        itemPrice: values.itemPrice,
        itemPaidBy: (values.itemPrice ?? 0) > 0 ? 'receiver' : 'sender',
        quantity: values.quantity,
        tier: values.tier,
        options: values.options,
        notes: values.notes || null,
      };
      // Only send shippingPrice for tier D (admin-priced). A/B/C are auto-calculated server-side.
      if (values.tier === 'D' && typeof values.shippingPrice === 'number') {
        body.shippingPrice = values.shippingPrice;
      }
      return updateAdminShipment(shipment._id, body);
    },
    onSuccess: () => {
      toast.success(t('domestic.admin.detail.updated', 'Shipment updated.'));
      qc.invalidateQueries({ queryKey: ['domestic-shipment', shipment._id] });
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      qc.invalidateQueries({ queryKey: ['domestic-shipment-transactions', { id: shipment._id }] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Save failed'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('domestic.admin.detail.edit-title', 'Edit shipment')}</DialogTitle>
          <DialogDescription>
            {t(
              'domestic.admin.detail.edit-subtitle',
              'Sender and status can\'t be changed here. Use the status popover for status changes.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.origin', 'Origin city')}</Label>
              <CityCombobox
                value={form.watch('originCity')}
                onChange={(v) => form.setValue('originCity', v, { shouldValidate: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.dest-city', 'Destination city')}</Label>
              <CityCombobox
                value={form.watch('recipient.city')}
                onChange={(v) => form.setValue('recipient.city', v, { shouldValidate: true })}
                excludeCity={originCity}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.recipient-name', 'Recipient name')}</Label>
              <Input {...form.register('recipient.name')} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.primary-phone', 'Primary phone')}</Label>
              <Input {...form.register('recipient.primaryPhone')} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.alt-phone', 'Alternate phone')}</Label>
              <Input {...form.register('recipient.alternatePhone')} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.quantity', 'Quantity')}</Label>
              <Input type="number" min="1" step="1" {...form.register('quantity', { valueAsNumber: true })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.address', 'Address')}</Label>
              <Textarea rows={2} {...form.register('recipient.address')} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.description', 'Item description')}</Label>
              <Textarea rows={2} {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.item-price', 'Item price (LYD)')}</Label>
              <Input type="number" step="0.01" min="0" {...form.register('itemPrice', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.tier', 'Tier')}</Label>
              <Controller
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Tier A</SelectItem>
                      <SelectItem value="B">Tier B</SelectItem>
                      <SelectItem value="C">Tier C</SelectItem>
                      <SelectItem value="D">Tier D (manual price)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {tier === 'D' && (
              <div className="md:col-span-2 space-y-2">
                <Label>
                  {t('domestic.admin.shipments.walk-in.shipping-price', 'Shipping price (LYD)')}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('shippingPrice', { valueAsNumber: true })}
                />
                {form.formState.errors.shippingPrice && (
                  <p className="text-sm text-destructive">{form.formState.errors.shippingPrice.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t(
                    'domestic.admin.shipments.walk-in.tier-d-hint',
                    'Tier D: shipping price is set manually by the admin.'
                  )}
                </p>
              </div>
            )}

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Controller
                control={form.control}
                name="options.fragile"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border cursor-pointer">
                    <span className="text-sm">{t('domestic.admin.shipments.options.fragile', 'Fragile')}</span>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              <Controller
                control={form.control}
                name="options.storeOnDeliveryFailure"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border cursor-pointer">
                    <span className="text-sm">{t('domestic.admin.shipments.options.store', 'Store on failure')}</span>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              <Controller
                control={form.control}
                name="options.insurance"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border cursor-pointer">
                    <span className="text-sm">{t('domestic.admin.shipments.options.insurance', 'Insurance')}</span>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.notes', 'Notes')}</Label>
              <Textarea rows={2} {...form.register('notes')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save', 'Save changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}