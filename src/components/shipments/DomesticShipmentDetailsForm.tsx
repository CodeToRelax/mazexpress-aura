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
import { getDomesticRoutes } from '@/utilities/api/config.api';

interface DomesticShipmentDetailsFormProps {
  control: Control<any>;
  isDisabled?: boolean;
}

export function DomesticShipmentDetailsForm({ control, isDisabled }: DomesticShipmentDetailsFormProps) {
  const { t } = useTranslation();
  const [routePrices, setRoutePrices] = useState<Record<string, Record<string, number>>>({});
  const [originCities, setOriginCities] = useState<string[]>([]);

  // Watch origin and destination cities for price calculation
  const originCity = useWatch({ control, name: 'originCity' });
  const destinationCity = useWatch({ control, name: 'shipmentDestination' });

  // Fetch domestic routes configuration
  useEffect(() => {
    getDomesticRoutes()
      .then(data => {
        console.log('Domestic routes data:', data);
        setRoutePrices(data.domestic || {});
        // API returns 'cities' not 'originCities'
        setOriginCities(data.cities || Object.keys(data.domestic || {}));
      })
      .catch(console.error);
  }, []);

  // Get available destination cities based on selected origin
  const getAvailableDestinations = () => {
    if (!originCity) {
      // If no origin selected, show all unique destinations
      const allDests = new Set<string>();
      Object.values(routePrices).forEach(routes => {
        Object.keys(routes).forEach(dest => allDests.add(dest));
      });
      return Array.from(allDests);
    }
    const normalizedOrigin = originCity.toLowerCase();
    const originRoutes = routePrices[normalizedOrigin];
    return originRoutes ? Object.keys(originRoutes) : [];
  };

  // Get route price for display
  const getRoutePrice = () => {
    if (!originCity || !destinationCity) return null;
    const normalizedOrigin = originCity.toLowerCase();
    const normalizedDest = destinationCity.toLowerCase();
    return routePrices[normalizedOrigin]?.[normalizedDest] ?? null;
  };

  const routePrice = getRoutePrice();

  // Convert origin cities to options
  const originCityOptions = originCities.map(city => ({
    value: city,
    label: city.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));

  // Convert available destinations to options
  const destCityOptions = getAvailableDestinations().map(city => ({
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
        {/* Origin City */}
        <FormField
          control={control}
          name="originCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.fields.originCity')} *</FormLabel>
              <FormControl>
                <CitySearchCombobox
                  cities={originCityOptions}
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

        {/* Destination City - Required */}
        <FormField
          control={control}
          name="shipmentDestination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipments.fields.destinationCity')} *</FormLabel>
              <FormControl>
                <CitySearchCombobox
                  cities={destCityOptions}
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

        {/* Route Price Display */}
        {routePrice !== null && (
          <div className="col-span-full p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('shipments.fields.shippingPrice')}</p>
            <p className="text-lg font-bold text-primary">{routePrice} LYD</p>
          </div>
        )}

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