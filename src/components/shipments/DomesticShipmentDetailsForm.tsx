import { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DomesticShipmentDetailsFormProps {
  control: Control<any>;
  isDisabled?: boolean;
}

export function DomesticShipmentDetailsForm({ control, isDisabled }: DomesticShipmentDetailsFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 bg-accent/50 backdrop-blur-sm border border-accent rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Home className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('shipments.form.fields.domesticDetails')}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t('shipments.form.descriptions.domesticDetails')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sender Name */}
        <FormField
          control={control}
          name="domesticShipmentDetails.senderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.form.fields.senderName')}</FormLabel>
              <FormControl>
                  <Input
                    {...field}
                    disabled={isDisabled}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Receiver Name */}
        <FormField
          control={control}
          name="domesticShipmentDetails.receiverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.form.fields.receiverName')}</FormLabel>
              <FormControl>
                  <Input
                    {...field}
                    disabled={isDisabled}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary Phone */}
        <FormField
          control={control}
          name="domesticShipmentDetails.receiverPrimaryPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.form.fields.receiverPrimaryPhone')}</FormLabel>
              <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    disabled={isDisabled}
                  />
              </FormControl>
              <FormDescription>
                {t('shipments.form.descriptions.phoneFormat')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Secondary Phone */}
        <FormField
          control={control}
          name="domesticShipmentDetails.receiverSecondaryPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.form.fields.receiverSecondaryPhone')}</FormLabel>
              <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    disabled={isDisabled}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Price */}
        <FormField
          control={control}
          name="domesticShipmentDetails.productPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.form.fields.productPrice')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  disabled={isDisabled}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : parseFloat(value));
                  }}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                {t('shipments.form.descriptions.productInfo')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Quantity */}
        <FormField
          control={control}
          name="domesticShipmentDetails.productQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.form.fields.productQuantity')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="1"
                  min="1"
                  disabled={isDisabled}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Detailed Destination - Full Width */}
        <FormField
          control={control}
          name="domesticShipmentDetails.destination"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>{t('shipments.form.fields.detailedDestination')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isDisabled}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Shipping Payment Responsibility - Full Width */}
        <FormField
          control={control}
          name="domesticShipmentDetails.customerPaysShipping"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>{t('shipments.form.fields.shippingPayment')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'customer')}
                  value={field.value ? 'customer' : 'company'}
                  disabled={isDisabled}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="company-pays" />
                    <Label htmlFor="company-pays" className="cursor-pointer">
                      {t('shipments.form.fields.companyPays')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer-pays" />
                    <Label htmlFor="customer-pays" className="cursor-pointer">
                      {t('shipments.form.fields.customerPays')}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                {t('shipments.form.descriptions.shippingCost')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Domestic Note - Full Width */}
        <FormField
          control={control}
          name="domesticShipmentDetails.note"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>{t('shipments.form.fields.domesticNote')}</FormLabel>
              <FormControl>
                  <Textarea
                    {...field}
                    disabled={isDisabled}
                    rows={3}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
