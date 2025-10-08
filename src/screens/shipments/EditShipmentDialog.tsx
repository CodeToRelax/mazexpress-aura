import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { IShipment } from '@/types/shipment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { updateShipmentSchema, type UpdateShipmentFormData } from '@/utilities/zod/shipment.schemas';
import { ShipmentDestination, ShippingMethod, ShipmentStatus } from '@/types/shipment';

interface EditShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: IShipment;
  onSuccess: () => void;
}

export function EditShipmentDialog({ open, onOpenChange, shipment, onSuccess }: EditShipmentDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateShipmentFormData>({
    resolver: zodResolver(updateShipmentSchema),
    defaultValues: {
      csn: shipment.csn,
      isn: shipment.isn || '',
      shipmentDestination: shipment.shipmentDestination as any,
      shippingMethod: shipment.shippingMethod as any,
      status: shipment.status as ShipmentStatus,
      isDomestic: shipment.isDomestic,
      size: {
        weight: shipment.size?.weight || undefined,
        height: shipment.size?.height || undefined,
        width: shipment.size?.width || undefined,
        length: shipment.size?.length || undefined,
      },
      extraCosts: shipment.extraCosts || 0,
      note: shipment.note || '',
      estimatedArrival: shipment.estimatedArrival || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        csn: shipment.csn,
        isn: shipment.isn || '',
        shipmentDestination: shipment.shipmentDestination as any,
        shippingMethod: shipment.shippingMethod as any,
        status: shipment.status as ShipmentStatus,
        isDomestic: shipment.isDomestic,
        size: {
          weight: shipment.size?.weight || undefined,
          height: shipment.size?.height || undefined,
          width: shipment.size?.width || undefined,
          length: shipment.size?.length || undefined,
        },
        extraCosts: shipment.extraCosts || 0,
        note: shipment.note || '',
        estimatedArrival: shipment.estimatedArrival || '',
      });
    }
  }, [open, shipment, form]);

  const onSubmit = async (data: UpdateShipmentFormData) => {
    try {
      setIsSubmitting(true);
      await shipmentsApi.updateShipment(shipment._id, data as any);
      toast({
        title: t('status.success'),
        description: t('shipments.messages.updateSuccess'),
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('shipments.messages.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('shipments.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('shipments.form.basicInfo')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="csn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.csn')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('shipments.form.placeholders.csn')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.isn')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('shipments.form.placeholders.isn')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ShipmentStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(`shipments.table.status.${status}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isDomestic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('shipments.form.fields.isDomestic')}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Shipping Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('shipments.form.shippingInfo')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shipmentDestination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.destination')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ShipmentDestination).map((dest) => (
                            <SelectItem key={dest} value={dest}>
                              {dest}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.method')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ShippingMethod).map((method) => (
                            <SelectItem key={method} value={method}>
                              {t(`shipments.table.method.${method}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedArrival"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.estimatedArrival')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extraCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.extraCosts')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Size & Dimensions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('shipments.form.sizeInfo')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="size.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.weight')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size.height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.height')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size.width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.width')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.length')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Optional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('shipments.form.optionalInfo')}</h3>
              
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shipments.form.fields.note')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t('shipments.form.placeholders.note')}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('warehouses.form.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
