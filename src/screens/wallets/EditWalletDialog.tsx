import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types/user';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { usersApi } from '@/utilities/api/users.api';
import { updateUserSchema, type UpdateUserFormData } from '@/utilities/zod/user.schemas';
import { ResponsiveFormLayout, FormSection, FormField } from '@/components/layout/ResponsiveFormLayout';

interface EditWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function EditWalletDialog({ open, onOpenChange, user, onSuccess }: EditWalletDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, setValue, watch, reset } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (user && open) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      setValue('phoneNumber', user.phoneNumber);
      setValue('birthdate', user.birthdate);
      setValue('gender', user.gender);
      setValue('address.country', user.address.country);
      setValue('address.city', user.address.city as any);
      setValue('userType', user.userType);
      setValue('disabled', user.disabled);
    }
  }, [user, open, setValue]);

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await usersApi.updateUser(user._id, data as any);
      toast({ title: t('wallets.messages.updateSuccess') });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({ title: t('wallets.messages.error'), description: error instanceof Error ? error.message : 'Failed to update', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('wallets.actions.edit')}</DialogTitle>
          <DialogDescription>Update wallet information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ResponsiveFormLayout>
            <FormSection title="Personal Information" columns={2}>
              <FormField>
                <Label>First Name *</Label>
                <Input {...register('firstName')} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </FormField>
              <FormField>
                <Label>Last Name *</Label>
                <Input {...register('lastName')} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </FormField>
            </FormSection>
          </ResponsiveFormLayout>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
