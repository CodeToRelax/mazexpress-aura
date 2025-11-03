import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Calendar as CalendarIcon, Globe, Home } from 'lucide-react';
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
import { CitySearchCombobox } from '@/components/ui/CitySearchCombobox';
import { DomesticShipmentDetailsForm } from '@/components/shipments/DomesticShipmentDetailsForm';
import { toast } from '@/hooks/use-toast';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { createShipmentSchema, type CreateShipmentFormData } from '@/utilities/zod/shipment.schemas';
import { Cities, ShippingMethod } from '@/types/shipment';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateISO } from '@/utilities/helpers/dateHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateShipmentDialog({ open, onOpenChange, onSuccess }: CreateShipmentDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeInputMode, setSizeInputMode] = useState<'weight' | 'dimensions'>('weight');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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
      domesticShipmentDetails: {
        senderName: '',
        receiverName: '',
        receiverPrimaryPhoneNumber: '',
        receiverSecondaryPhoneNumber: '',
        destination: '',
        productPrice: undefined,
        productQuantity: undefined,
        customerPaysShipping: false,
        note: '',
      },
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSizeInputMode('weight');
      setSelectedCustomer(null);
    }
  }, [open, form]);

  const onSubmit = async (data: CreateShipmentFormData) => {
    try {
      setIsSubmitting(true);
      
      // Remove originCity from domesticShipmentDetails as it's not part of API schema
      const domesticDetails = data.domesticShipmentDetails 
        ? {
            ...data.domesticShipmentDetails,
            originCity: undefined,
          }
        : undefined;
      
      const submitData = {
        ...data,
        domesticShipmentDetails: domesticDetails,
      };
      
      await shipmentsApi.createShipment(submitData as any);
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
                          onCustomerSelect={(customer) => {
                            setSelectedCustomer(customer);
                            if (customer?.address?.city) {
                              form.setValue('shipmentDestination', customer.address.city as any);
                            }
                          }}
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

                {!form.watch('isDomestic') && (
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
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shipment Type Toggle */}
                <FormField
                  control={form.control}
                  name="isDomestic"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>{t('shipments.form.fields.shipmentType')}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={!field.value ? "default" : "outline"}
                            className="flex-1 transition-all"
                            onClick={() => field.onChange(false)}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            {t('shipments.form.fields.international')}
                          </Button>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className="flex-1 transition-all"
                            onClick={() => field.onChange(true)}
                          >
                            <Home className="h-4 w-4 mr-2" />
                            {t('shipments.form.fields.domestic')}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch('isDomestic') && (
                  <FormField
                    control={form.control}
                    name="originCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('shipments.form.fields.originCountry')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('shipments.form.placeholders.originCountry', { defaultValue: 'Select origin country' })} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="turkey">{t('shipments.originCountry.turkey', { defaultValue: 'Turkey' })}</SelectItem>
                            <SelectItem value="china">{t('shipments.originCountry.china', { defaultValue: 'China' })}</SelectItem>
                            <SelectItem value="uae">{t('shipments.originCountry.uae', { defaultValue: 'UAE' })}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t('shipments.form.descriptions.originCountry', { defaultValue: 'Country where shipment originates from' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Domestic Shipment Details Form */}
              {form.watch('isDomestic') && (
                <DomesticShipmentDetailsForm
                  control={form.control}
                  isDisabled={isSubmitting}
                />
              )}
            </div>

            {/* Shipping Details - Only for International */}
            {!form.watch('isDomestic') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('shipments.form.shippingInfo')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shipmentDestination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('shipments.form.fields.destination')}</FormLabel>
                        <FormControl>
                          <CitySearchCombobox
                            cities={Object.values(Cities).map((city) => ({
                              value: city,
                              label: city.charAt(0).toUpperCase() + city.slice(1).replace(/_/g, ' ')
                            }))}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('shipments.filters.allDestinations')}
                          />
                        </FormControl>
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
            )}

            {/* Size & Dimensions - Only for International */}
            {!form.watch('isDomestic') && (
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
            )}

            {/* Optional Information - Only for International */}
            {!form.watch('isDomestic') && (
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
            )}

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
