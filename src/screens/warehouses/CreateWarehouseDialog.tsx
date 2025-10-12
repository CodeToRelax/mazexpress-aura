import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createWarehouseSchema, type CreateWarehouseFormData } from '@/utilities/zod/warehouse.schemas';
import { createWarehouse } from '@/utilities/api/warehouses.api';
import { useToast } from '@/hooks/use-toast';
import { WarehouseStatus, Cities, Countries } from '@/types/warehouse';
import { OperatingHoursEditor } from './OperatingHoursEditor';

interface CreateWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateWarehouseDialog({ open, onOpenChange, onSuccess }: CreateWarehouseDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const defaultDayHours = {
    isOpen: true,
    openTime: undefined,
    closeTime: undefined,
    breakStartTime: undefined,
    breakEndTime: undefined,
  };

  const form = useForm<CreateWarehouseFormData>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: '',
      status: WarehouseStatus.OPEN,
      address: {
        city: '' as any,
        country: '' as any,
        doorNumber: '',
        buildingNumber: '',
        street: '',
        neighborhood: '',
        district: '',
        zipCode: '',
        googleMapsUrl: '',
        coordinates: {
          latitude: undefined,
          longitude: undefined,
        },
      },
      phoneNumber: '',
      email: '',
      youtubeUrl: '',
      imageUrl: '',
      operatingHours: {
        monday: defaultDayHours,
        tuesday: defaultDayHours,
        wednesday: defaultDayHours,
        thursday: defaultDayHours,
        friday: defaultDayHours,
        saturday: defaultDayHours,
        sunday: defaultDayHours,
      },
    },
  });

  const onSubmit = async (data: CreateWarehouseFormData) => {
    console.log('=== CREATE WAREHOUSE FORM SUBMITTED ===');
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    
    try {
      setIsSubmitting(true);
      await createWarehouse(data as any);
      toast({
        title: t('status.success'),
        description: t('warehouses.messages.createSuccess'),
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Create warehouse error:', error);
      toast({
        variant: 'destructive',
        title: t('status.error'),
        description: error.message || t('warehouses.messages.error'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wizard navigation
  const tabs = ['basic', 'address', 'contact', 'hours'];
  const currentTabIndex = tabs.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;
  
  const handleNext = () => {
    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    if (!isFirstTab) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset();
        setActiveTab('basic');
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto">
        <DialogHeader>
          <DialogTitle>{t('warehouses.form.createTitle')}</DialogTitle>
          <DialogDescription>
            Fill in the warehouse details. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <Form {...form}>
            <form id="create-warehouse-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" disabled={activeTab !== 'basic'}>
                    {t('warehouses.form.basicInfo')}
                  </TabsTrigger>
                  <TabsTrigger value="address" disabled={activeTab !== 'address'}>
                    {t('warehouses.form.addressInfo')}
                  </TabsTrigger>
                  <TabsTrigger value="contact" disabled={activeTab !== 'contact'}>
                    {t('warehouses.form.contactInfo')}
                  </TabsTrigger>
                  <TabsTrigger value="hours" disabled={activeTab !== 'hours'}>
                    Operating Hours
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.name')} *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
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
                      <FormLabel>{t('warehouses.detail.fields.status')} *</FormLabel>
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

              {/* Address Info Tab */}
              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.doorNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.doorNumber')} (Optional)</FormLabel>
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
                        <FormLabel>{t('warehouses.detail.fields.buildingNumber')} (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.street')} (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.neighborhood')} (Optional)</FormLabel>
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
                        <FormLabel>{t('warehouses.detail.fields.district')} (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.city')} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {Object.values(Cities).map((city) => (
                              <SelectItem key={city} value={city}>
                                {city.split(' ').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
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
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.country')} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Countries).map((country) => (
                              <SelectItem key={country} value={country}>
                                {country.charAt(0).toUpperCase() + country.slice(1)}
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
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.zipCode')} *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.googleMapsUrl')} *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} type="url" placeholder="https://maps.google.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.coordinates.latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('warehouses.detail.fields.latitude')} *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
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
                        <FormLabel>{t('warehouses.detail.fields.longitude')} *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Contact Info Tab */}
              <TabsContent value="contact" className="space-y-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.fields.phoneNumber')} (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} type="tel" />
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
                      <FormLabel>{t('warehouses.detail.fields.email')} (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} type="email" />
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
                      <FormLabel>{t('warehouses.detail.fields.youtubeUrl')} (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} type="url" placeholder="https://youtube.com/..." />
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
                      <FormLabel>{t('warehouses.detail.fields.imageUrl')} (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} type="url" placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Operating Hours Tab */}
              <TabsContent value="hours">
                <OperatingHoursEditor form={form} />
              </TabsContent>
            </Tabs>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex gap-2 border-t pt-4 mt-0 bg-background pointer-events-auto">
          {!isFirstTab && (
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          
          {!isLastTab && (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
          
          {isLastTab && (
            <Button 
              type="submit"
              form="create-warehouse-form"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Warehouse
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
