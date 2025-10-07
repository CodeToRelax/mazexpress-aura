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
import { toast } from '@/hooks/use-toast';
import { updateWarehouse } from '@/utilities/api/warehouses.api';
import { updateWarehouseSchema, type UpdateWarehouseFormData } from '@/utilities/zod/warehouse.schemas';
import { WarehouseStatus, type Warehouse } from '@/types/warehouse';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('warehouses.form.editTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('warehouses.detail.fields.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
