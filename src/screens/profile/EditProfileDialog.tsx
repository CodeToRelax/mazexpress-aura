import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

import { profileUpdateSchema, type ProfileUpdateFormData } from '@/utilities/zod/user.schemas';
import { usersApi } from '@/utilities/api/users.api';
import { User } from '@/types/user';

// City options by country
const citiesByCountry: Record<string, { value: string; label: string }[]> = {
  libya: [
    { value: 'tripoli', label: 'Tripoli' },
    { value: 'benghazi', label: 'Benghazi' },
    { value: 'musrata', label: 'Misrata' },
    { value: 'al bayda', label: 'Al Bayda' },
    { value: 'zawiya', label: 'Zawiya' },
    { value: 'gharyan', label: 'Gharyan' },
    { value: 'tobruk', label: 'Tobruk' },
    { value: 'ajdabiya', label: 'Ajdabiya' },
    { value: 'zliten', label: 'Zliten' },
    { value: 'derna', label: 'Derna' },
    { value: 'sirte', label: 'Sirte' },
    { value: 'sabha', label: 'Sabha' },
    { value: 'khoms', label: 'Khoms' },
  ],
  turkey: [
    { value: 'istanbul', label: 'Istanbul' },
    { value: 'ankara', label: 'Ankara' },
    { value: 'izmir', label: 'Izmir' },
    { value: 'bursa', label: 'Bursa' },
    { value: 'antalya', label: 'Antalya' },
    { value: 'adana', label: 'Adana' },
    { value: 'konya', label: 'Konya' },
    { value: 'gaziantep', label: 'Gaziantep' },
    { value: 'mersin', label: 'Mersin' },
  ],
  china: [
    { value: 'hongkong', label: 'Hong Kong' },
    { value: 'beijing', label: 'Beijing' },
    { value: 'shanghai', label: 'Shanghai' },
    { value: 'guangzhou', label: 'Guangzhou' },
    { value: 'shenzhen', label: 'Shenzhen' },
    { value: 'chengdu', label: 'Chengdu' },
    { value: 'wuhan', label: 'Wuhan' },
  ],
  uae: [
    { value: 'dubai', label: 'Dubai' },
    { value: 'abu dhabi', label: 'Abu Dhabi' },
    { value: 'sharjah', label: 'Sharjah' },
    { value: 'ajman', label: 'Ajman' },
    { value: 'ras al khaimah', label: 'Ras Al Khaimah' },
    { value: 'fujairah', label: 'Fujairah' },
  ],
};

const countries = [
  { value: 'libya', label: 'Libya' },
  { value: 'turkey', label: 'Turkey' },
  { value: 'china', label: 'China' },
  { value: 'uae', label: 'UAE' },
];

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: User;
  onSuccess: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: EditProfileDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phoneNumber: profile.phoneNumber || '',
      birthdate: profile.birthdate || '',
      gender: profile.gender || 'male',
      address: {
        street: profile.address?.street || '',
        specificDescription: profile.address?.specificDescription || '',
        city: (profile.address?.city || 'tripoli') as ProfileUpdateFormData['address']['city'],
        country: (profile.address?.country || 'libya') as ProfileUpdateFormData['address']['country'],
      },
    },
  });

  const selectedCountry = form.watch('address.country');

  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        birthdate: profile.birthdate || '',
        gender: profile.gender || 'male',
        address: {
          street: profile.address?.street || '',
          specificDescription: profile.address?.specificDescription || '',
          city: (profile.address?.city || 'tripoli') as ProfileUpdateFormData['address']['city'],
          country: (profile.address?.country || 'libya') as ProfileUpdateFormData['address']['country'],
        },
      });
    }
  }, [profile, form]);

  // Reset city when country changes
  useEffect(() => {
    const currentCity = form.getValues('address.city');
    const availableCities = citiesByCountry[selectedCountry] || [];
    const cityExists = availableCities.some((c) => c.value === currentCity);
    
    if (!cityExists && availableCities.length > 0) {
      form.setValue('address.city', availableCities[0].value as ProfileUpdateFormData['address']['city']);
    }
  }, [selectedCountry, form]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsSubmitting(true);
    try {
      await usersApi.updateUser(profile._id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        birthdate: data.birthdate,
        gender: data.gender,
        address: {
          street: data.address.street,
          specificDescription: data.address.specificDescription,
          city: data.address.city,
          country: data.address.country,
        },
      });
      toast.success(t('profile.messages.updateSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('profile.messages.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{t('profile.editDialog.title')}</DialogTitle>
          <DialogDescription>{t('profile.editDialog.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('users.detail.generalInfo')}
              </h3>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.firstName')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.lastName')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.gender')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">{t('users.filters.male')}</SelectItem>
                          <SelectItem value="female">{t('users.filters.female')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.birthdate')} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DD/MM/YYYY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('users.detail.contactInfo')}
              </h3>
              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">{t('users.detail.fields.email')}</Label>
                  <Input 
                    value={profile.email} 
                    disabled 
                    className="mt-1.5 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('profile.emailReadOnly')}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.phone')} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+218..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('users.detail.addressInfo')}
              </h3>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.country')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
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
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.detail.fields.city')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(citiesByCountry[selectedCountry] || []).map((city) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
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
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.detail.fields.street')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.specificDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.detail.fields.specificDescription')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('profile.actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
