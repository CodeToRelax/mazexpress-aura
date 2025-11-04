import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Search, Package, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { StatusBadge } from '@/components/shipments/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import type { IShipment } from '@/types/shipment';

const trackingSchema = z.object({
  esn: z.string()
    .min(1, 'ESN is required')
    .regex(
      /^([A-Z]{3}-[A-Z0-9]{6,8}|\d{10})$/i,
      'Invalid ESN format. Use format like BEN-123456 or 1234567890'
    ),
});

type TrackingFormData = z.infer<typeof trackingSchema>;

export default function TrackShipment() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [shipment, setShipment] = useState<IShipment | null>(null);

  const form = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      esn: '',
    },
  });

  const onSubmit = async (data: TrackingFormData) => {
    try {
      setIsLoading(true);
      const response = await shipmentsApi.trackShipment(data.esn);
      setShipment(response.data);
      toast({
        title: t('status.success'),
        description: t('shipments.messages.trackSuccess', { defaultValue: 'Shipment found!' }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to track shipment';
      toast({
        title: t('status.error'),
        description: message,
        variant: 'destructive',
      });
      setShipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-background min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{t('shipments.actions.track')}</h1>
          <p className="text-muted-foreground">
            {t('shipments.tracking.subtitle', { defaultValue: 'Enter your ESN to track your shipment' })}
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>{t('shipments.tracking.searchTitle', { defaultValue: 'Track Your Shipment' })}</CardTitle>
              <CardDescription>
                {t('shipments.tracking.searchDescription', {
                  defaultValue: 'Enter your External Shipping Number (ESN) to view shipment details and status',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="esn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('shipments.table.columns.esn')}</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('shipments.tracking.esnPlaceholder', {
                                defaultValue: 'e.g., BEN-123456 or 1234567890',
                              })}
                              {...field}
                              className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
                              <span className="ml-2">{t('shipments.actions.track')}</span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shipment Details */}
        {shipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{t('shipments.tracking.details', { defaultValue: 'Shipment Details' })}</CardTitle>
                    <CardDescription>ESN: {shipment.esn}</CardDescription>
                  </div>
                  <StatusBadge status={shipment.status} className="text-sm" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Package className="h-4 w-4 mr-2" />
                      {t('shipments.table.columns.csn')}
                    </div>
                    <p className="font-medium">{shipment.csn}</p>
                  </div>

                  {shipment.isn && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="h-4 w-4 mr-2" />
                        {t('shipments.table.columns.isn')}
                      </div>
                      <p className="font-medium">{shipment.isn}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('shipments.table.columns.destination')}
                    </div>
                    <p className="font-medium capitalize">{shipment.shipmentDestination}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {t('shipments.table.columns.method')}
                    </div>
                    <p className="font-medium capitalize">{t(`shipments.table.method.${shipment.shippingMethod}`)}</p>
                  </div>
                </div>

                <Separator />

                {/* Size Information */}
                <div>
                  <h3 className="font-semibold mb-3">{t('shipments.form.sizeInfo')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {shipment.size.weight && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('shipments.fields.weight')}</p>
                        <p className="font-semibold">{shipment.size.weight} kg</p>
                      </div>
                    )}
                    {shipment.size.height && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('shipments.fields.height')}</p>
                        <p className="font-semibold">{shipment.size.height} cm</p>
                      </div>
                    )}
                    {shipment.size.width && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('shipments.fields.width')}</p>
                        <p className="font-semibold">{shipment.size.width} cm</p>
                      </div>
                    )}
                    {shipment.size.length && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t('shipments.fields.length')}</p>
                        <p className="font-semibold">{shipment.size.length} cm</p>
                      </div>
                    )}
                  </div>
                </div>

                {shipment.note && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">{t('shipments.table.columns.note')}</h3>
                      <p className="text-muted-foreground">{shipment.note}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-3">{t('shipments.tracking.timeline', { defaultValue: 'Timeline' })}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('shipments.table.columns.createdAt')}</span>
                      <span className="font-medium">
                        {new Date(shipment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('shipments.table.columns.updatedAt')}</span>
                      <span className="font-medium">
                        {new Date(shipment.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
