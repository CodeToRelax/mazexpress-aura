import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { updateWarehouse } from '@/utilities/api/warehouses.api';
import { updateWarehouseSchema, type UpdateWarehouseFormData } from '@/utilities/zod/warehouse.schemas';
import { WarehouseStatus, type Warehouse } from '@/types/warehouse';
import { OperatingHoursEditor } from './OperatingHoursEditor';

interface EditWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse;
  onSuccess: () => void;
}

export function EditWarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: EditWarehouseDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateWarehouseFormData>({
    resolver: zodResolver(updateWarehouseSchema),
    defaultValues: {
      name: warehouse.name,
      status: warehouse.status,
      phoneNumber: warehouse.phoneNumber || '',
      email: warehouse.email || '',
      youtubeUrl: warehouse.youtubeUrl || '',
      imageUrl: warehouse.imageUrl || '',
      address: warehouse.address,
      operatingHours: warehouse.operatingHours,
    },
  });

  const onSubmit = async (data: UpdateWarehouseFormData) => {
    try {
      setIsSubmitting(true);
      await updateWarehouse(warehouse._id, data as any);
      toast({
        title: t('status.success'),
        description: t('warehouses.messages.updateSuccess'),
      });
      onSuccess();
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('warehouses.messages.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('warehouses.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t('warehouses.form.basicInfo')}</TabsTrigger>
                <TabsTrigger value="address">{t('warehouses.form.addressInfo')}</TabsTrigger>
                <TabsTrigger value="contact">{t('warehouses.form.contactInfo')}</TabsTrigger>
                <TabsTrigger value="hours">{t('warehouses.form.operatingHours')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>{t('warehouses.detail.fields.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WarehouseStatus.OPEN}>
                            {t('warehouses.table.status.open')}
                          </SelectItem>
                          <SelectItem value={WarehouseStatus.CLOSED}>
                            {t('warehouses.table.status.closed')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.doorNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.doorNumber')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.buildingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.buildingNumber')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.street')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.neighborhood')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.district')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.city')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.country')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.zipCode')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.coordinates.latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.latitude')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.coordinates.longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.longitude')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address.googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.googleMapsUrl')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://maps.google.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.youtubeUrl')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="https://youtube.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.imageUrl')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="hours" className="mt-4">
                <OperatingHoursEditor form={form} />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('warehouses.form.cancel')}
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
