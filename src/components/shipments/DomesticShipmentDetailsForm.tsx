import { useState, useEffect } from 'react';
import { Control, useWatch } from 'react-hook-form';
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
import { CitySearchCombobox } from '@/components/ui/CitySearchCombobox';
import { Cities } from '@/types/shipment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDomesticCities, TiersConfig } from '@/utilities/api/config.api';

interface DomesticShipmentDetailsFormProps {
  control: Control<any>;
  isDisabled?: boolean;
}

export function DomesticShipmentDetailsForm({ control, isDisabled }: DomesticShipmentDetailsFormProps) {
  const { t } = useTranslation();
  const [tierPrices, setTierPrices] = useState<Record<string, TiersConfig>>({});

  // Watch the destination city to update tier labels
  const selectedCity = useWatch({ control, name: 'shipmentDestination' });

  // Fetch domestic cities configuration
  useEffect(() => {
    getDomesticCities()
      .then(data => {
        console.log('Domestic cities data:', data);
        setTierPrices(data.domestic);
      })
      .catch(console.error);
  }, []);

  // Helper to get tier label with price
  const getTierLabel = (tier: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!selectedCity) {
      return t('shipments.tiers.' + tier);
    }
    
    // Normalize the city key for lookup (handle different cases)
    const normalizedCity = selectedCity.toLowerCase();
    
    // Find matching city in tierPrices (case-insensitive)
    const cityKey = Object.keys(tierPrices).find(
      key => key.toLowerCase() === normalizedCity
    );
    
    const cityTiers = cityKey ? tierPrices[cityKey] : null;
    
    if (cityTiers && cityTiers[tier] !== undefined) {
      return `${t('shipments.tiers.' + tier)} - ${cityTiers[tier]} LYD`;
    }
    return t('shipments.tiers.' + tier);
  };

  // Convert Cities enum to CityOption array
  const cityOptions = Object.values(Cities).map(city => ({
    value: city,
    label: city.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));

  return (
    <div className="space-y-4 glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Home className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('shipments.fields.domesticDetails')}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t('shipments.descriptions.domesticDetails')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Destination City - Required */}
        <FormField
          control={control}
          name="shipmentDestination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.fields.destinationCity')} *</FormLabel>
              <FormControl>
                <CitySearchCombobox
                  cities={cityOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isDisabled}
                  placeholder={t('shipments.placeholders.selectDestinationCity')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Origin City */}
        <FormField
          control={control}
          name="originCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.fields.originCity')}</FormLabel>
              <FormControl>
                <CitySearchCombobox
                  cities={cityOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isDisabled}
                  placeholder={t('shipments.placeholders.selectOriginCity')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tier Selection */}
        <FormField
          control={control}
          name="tier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.fields.tier')}</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={isDisabled}
              >
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t('shipments.placeholders.selectTier')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background">
                  <SelectItem value="A">{getTierLabel('A')}</SelectItem>
                  <SelectItem value="B">{getTierLabel('B')}</SelectItem>
                  <SelectItem value="C">{getTierLabel('C')}</SelectItem>
                  <SelectItem value="D">{getTierLabel('D')}</SelectItem>
                  <SelectItem value="E">{getTierLabel('E')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('shipments.descriptions.tier')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sender Name */}
        <FormField
          control={control}
          name="domesticShipmentDetails.senderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.fields.senderName')}</FormLabel>
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
              <FormLabel>{t('shipments.fields.receiverName')}</FormLabel>
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
              <FormLabel>{t('shipments.fields.receiverPrimaryPhone')}</FormLabel>
              <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    disabled={isDisabled}
                  />
              </FormControl>
              <FormDescription>
                {t('shipments.descriptions.phoneFormat')}
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
              <FormLabel>{t('shipments.fields.receiverSecondaryPhone')}</FormLabel>
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
              <FormLabel>{t('shipments.fields.productPrice')}</FormLabel>
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
                {t('shipments.descriptions.productInfo')}
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
              <FormLabel>{t('shipments.fields.productQuantity')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="1"
                  disabled={isDisabled}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : parseInt(value));
                  }}
                  value={field.value ?? ''}
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
              <FormLabel>{t('shipments.fields.detailedDestination')}</FormLabel>
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
              <FormLabel>{t('shipments.fields.shippingPayment')}</FormLabel>
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
                      {t('shipments.fields.companyPays')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer-pays" />
                    <Label htmlFor="customer-pays" className="cursor-pointer">
                      {t('shipments.fields.customerPays')}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                {t('shipments.descriptions.shippingCost')}
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
              <FormLabel>{t('shipments.fields.domesticNote')}</FormLabel>
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