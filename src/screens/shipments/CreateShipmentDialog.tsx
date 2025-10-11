import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerSearchCombobox } from '@/components/shipments/CustomerSearchCombobox';
import { toast } from '@/hooks/use-toast';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { createShipmentSchema, type CreateShipmentFormData } from '@/utilities/zod/shipment.schemas';
import { Cities, ShippingMethod } from '@/types/shipment';

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateShipmentDialog({ open, onOpenChange, onSuccess }: CreateShipmentDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeInputMode, setSizeInputMode] = useState<'weight' | 'dimensions'>('weight');

  const form = useForm<CreateShipmentFormData>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      csn: '',
      isn: '',
      shipmentDestination: undefined,
      shippingMethod: undefined,
      isDomestic: false,
      size: {
        weight: 1,
        height: 1,
        width: 1,
        length: 1,
      },
      extraCosts: 0,
      note: '',
      estimatedArrival: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSizeInputMode('weight');
    }
  }, [open, form]);

  const onSubmit = async (data: CreateShipmentFormData) => {
    try {
      setIsSubmitting(true);
      
      await shipmentsApi.createShipment(data as any);
      toast({
        title: t('status.success'),
        description: t('shipments.messages.createSuccess'),
      });
      form.reset();
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
          <DialogTitle>{t('shipments.form.createTitle')}</DialogTitle>
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
                        <CustomerSearchCombobox
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('shipments.form.descriptions.csnSearch', { defaultValue: 'Search for a customer by name, email, or CSN' })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shipments.form.fields.isn')} <span className="text-muted-foreground text-xs">({t('common.optional', { defaultValue: 'Optional' })})</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('shipments.form.placeholders.isn')} />
                      </FormControl>
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
                            <SelectValue placeholder={t('shipments.filters.allDestinations')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Cities).map((city) => (
                            <SelectItem key={city} value={city}>
                              {city.charAt(0).toUpperCase() + city.slice(1).replace(/ /g, ' ')}
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
                            <SelectValue placeholder={t('shipments.filters.allMethods')} />
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('shipments.form.sizeInfo')}</h3>
                <div className="flex items-center gap-3">
                  <Label htmlFor="size-mode" className="text-sm">
                    {sizeInputMode === 'weight' ? t('shipments.form.weightOnly', { defaultValue: 'Weight Only' }) : t('shipments.form.dimensions', { defaultValue: 'Dimensions' })}
                  </Label>
                  <Switch
                    id="size-mode"
                    checked={sizeInputMode === 'dimensions'}
                    onCheckedChange={(checked) => setSizeInputMode(checked ? 'dimensions' : 'weight')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizeInputMode === 'weight' ? (
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
                            placeholder={t('shipments.form.placeholders.weight')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
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
                              placeholder={t('shipments.form.placeholders.weight')}
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
                          placeholder={t('shipments.form.placeholders.height')}
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
                          placeholder={t('shipments.form.placeholders.width')}
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
                              placeholder={t('shipments.form.placeholders.length')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
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
                {t('shipments.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
