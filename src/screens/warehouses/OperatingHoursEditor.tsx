import { useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import type { WarehouseDayHours } from '@/types/warehouse';

interface OperatingHoursEditorProps {
  form: UseFormReturn<any>;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function OperatingHoursEditor({ form }: OperatingHoursEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {DAYS.map((day) => (
        <Card key={day} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t(`warehouses.detail.days.${day}`)}</h4>
              <FormField
                control={form.control}
                name={`operatingHours.${day}.isOpen`}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormLabel className="text-sm">
                      {field.value ? t('warehouses.detail.times.open') : t('warehouses.detail.times.closed')}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch(`operatingHours.${day}.isOpen`) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`operatingHours.${day}.openTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.times.openTime')}</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`operatingHours.${day}.closeTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.times.closeTime')}</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`operatingHours.${day}.breakStartTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.times.breakTime')} ({t('warehouses.detail.times.openTime')})</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`operatingHours.${day}.breakEndTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('warehouses.detail.times.breakTime')} ({t('warehouses.detail.times.closeTime')})</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
