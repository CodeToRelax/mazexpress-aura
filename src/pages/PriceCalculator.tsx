import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Calculator, Package, MapPin, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { priceCalculationSchema, type PriceCalculationFormData } from '@/utilities/zod/shipment.schemas';
import { ShippingMethod, Cities, type PriceCalculationPayload } from '@/types/shipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';

export default function PriceCalculator() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [sizeInputMode, setSizeInputMode] = useState<'weight' | 'dimensions'>('weight');

  const form = useForm<PriceCalculationFormData>({
    resolver: zodResolver(priceCalculationSchema),
    defaultValues: {
      weight: '',
      shippingMethod: ShippingMethod.AIR,
      destination: '',
      country: 'libya',
    },
  });

  const onSubmit = async (data: PriceCalculationFormData) => {
    try {
      setIsLoading(true);
      
      // Ensure dimensions are properly formatted if provided
      const payload = {
        ...data,
        dimensions: data.dimensions?.height && data.dimensions?.width && data.dimensions?.length
          ? {
              height: data.dimensions.height,
              width: data.dimensions.width,
              length: data.dimensions.length,
            }
          : undefined,
      };
      
      const response = await shipmentsApi.calculatePrice(payload as PriceCalculationPayload);
      setCalculatedPrice(response.data);
      toast({
        title: t('status.success'),
        description: t('shipments.messages.priceCalculated', { defaultValue: 'Price calculated successfully!' }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate price';
      toast({
        title: t('status.error'),
        description: message,
        variant: 'destructive',
      });
      setCalculatedPrice(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-background min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{t('shipments.actions.calculatePrice')}</h1>
          <p className="text-muted-foreground">
            {t('shipments.calculator.subtitle', { defaultValue: 'Get an instant shipping quote' })}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t('shipments.calculator.formTitle', { defaultValue: 'Shipment Details' })}</CardTitle>
                <CardDescription>
                  {t('shipments.calculator.formDescription', {
                    defaultValue: 'Enter your shipment information to calculate the shipping cost',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Shipping Method */}
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
                              <SelectItem value={ShippingMethod.AIR}>
                                <div className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  {t('shipments.table.method.air')}
                                </div>
                              </SelectItem>
                              <SelectItem value={ShippingMethod.SEA}>
                                {t('shipments.table.method.sea')}
                              </SelectItem>
                              <SelectItem value={ShippingMethod.LAND}>
                                {t('shipments.table.method.land')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Destination */}
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('shipments.form.fields.destination')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('shipments.filters.allDestinations')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {Object.values(Cities).map((city) => (
                                <SelectItem key={city} value={city}>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span className="capitalize">{city}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('shipments.calculator.country', { defaultValue: 'Country' })}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Libya, Turkey, UAE" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Size Input Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">
                          {t('shipments.calculator.sizeMode', { defaultValue: 'Size Input Mode' })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {sizeInputMode === 'weight'
                            ? t('shipments.calculator.weightOnly', { defaultValue: 'Weight only' })
                            : t('shipments.calculator.fullDimensions', { defaultValue: 'Full dimensions' })}
                        </p>
                      </div>
                      <Switch
                        checked={sizeInputMode === 'dimensions'}
                        onCheckedChange={(checked) => setSizeInputMode(checked ? 'dimensions' : 'weight')}
                      />
                    </div>

                    {/* Weight Input */}
                    {sizeInputMode === 'weight' && (
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('shipments.form.fields.weight')}</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder={t('shipments.form.placeholders.weight')}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('shipments.calculator.weightHint', { defaultValue: 'Enter weight in kilograms' })}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Dimensions Input */}
                    {sizeInputMode === 'dimensions' && (
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="dimensions.height"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('shipments.form.fields.height')}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="cm"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dimensions.width"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('shipments.form.fields.width')}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="cm"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dimensions.length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('shipments.form.fields.length')}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="cm"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          {t('status.loading')}
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          {t('shipments.actions.calculatePrice')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Price Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  {t('shipments.calculator.estimatedCost', { defaultValue: 'Estimated Cost' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calculatedPrice ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('shipments.calculator.totalPrice', { defaultValue: 'Total Price' })}
                      </p>
                      <p className="text-4xl font-bold text-primary">
                        ${calculatedPrice.totalPrice || calculatedPrice.price || 'N/A'}
                      </p>
                    </div>

                    {calculatedPrice.breakdown && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">
                            {t('shipments.calculator.breakdown', { defaultValue: 'Price Breakdown' })}
                          </h4>
                          {Object.entries(calculatedPrice.breakdown).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">${value as number}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      {t('shipments.calculator.enterDetails', {
                        defaultValue: 'Enter shipment details to calculate price',
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
