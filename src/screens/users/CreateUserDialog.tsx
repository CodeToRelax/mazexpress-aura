import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getFirebaseAuth } from '@/utilities/firebase/firebase';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/utilities/api/auth.api';
import { signupSchema, type SignupFormData } from '@/utilities/zod/user.schemas';
import { ResponsiveFormLayout, FormSection, FormField } from '@/components/layout/ResponsiveFormLayout';
import { CitySearchCombobox } from '@/components/ui/CitySearchCombobox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateISO } from '@/utilities/helpers/dateHelpers';
import { cn } from '@/lib/utils';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CITIES_BY_COUNTRY = {
  libya: [
    { value: 'benghazi', label: 'Benghazi' },
    { value: 'tripoli', label: 'Tripoli' },
    { value: 'musrata', label: 'Musrata' },
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
    { value: 'bani walid', label: 'Bani Walid' },
    { value: 'sabratha', label: 'Sabratha' },
    { value: 'zuwara', label: 'Zuwara' },
    { value: 'kufra', label: 'Kufra' },
    { value: 'al marj', label: 'Al Marj' },
    { value: 'tarhuna', label: 'Tarhuna' },
    { value: 'ubari', label: 'Ubari' },
    { value: 'gadames', label: 'Gadames' },
    { value: 'ghat', label: 'Ghat' },
    { value: 'nalut', label: 'Nalut' },
    { value: 'jalu', label: 'Jalu' },
    { value: 'brega', label: 'Brega' },
  ],
  turkey: [
    { value: 'istanbul', label: 'Istanbul' },
  ],
  uae: [
    { value: 'dubai', label: 'Dubai' },
  ],
  china: [
    { value: 'hongkong', label: 'Hong Kong' },
  ],
};

const COUNTRIES = [
  { value: 'libya', label: 'Libya' },
  { value: 'turkey', label: 'Turkey' },
  { value: 'china', label: 'China' },
  { value: 'uae', label: 'UAE' },
];

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      userType: 'customer',
    },
  });

  const privacyAgreement = watch('privacyPolicy.usageAgreement');
  const selectedCountry = watch('address.country');
  const userType = watch('userType');

  // Filter cities based on selected country
  const availableCities = selectedCountry ? CITIES_BY_COUNTRY[selectedCountry] || [] : [];

  // Reset city when country changes
  useEffect(() => {
    if (selectedCountry) {
      setValue('address.city', '' as any);
    }
  }, [selectedCountry, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      // Get the current user's auth token
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      const token = await user.getIdToken();

      // Type assertion: zod validation ensures all required fields are present
      await authApi.signup(data as any, token);
      
      toast({
        title: t('users.messages.createSuccess'),
        description: 'User account created successfully',
      });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: t('users.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('users.actions.create')}</DialogTitle>
          <DialogDescription>
            Create a new user account. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ResponsiveFormLayout>
            {/* Personal Information */}
            <FormSection title="Personal Information" columns={2}>
              <FormField>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="userType">User Type *</Label>
                <Select
                  defaultValue="customer"
                  onValueChange={(value) => setValue('userType', value as 'admin' | 'customer', { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.userType && (
                  <p className="text-sm text-destructive">{errors.userType.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female', { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="birthdate">Birth Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !watch('birthdate') && "text-muted-foreground"
                    )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch('birthdate') ? format(new Date(watch('birthdate')), 'dd/MM/yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch('birthdate') ? new Date(watch('birthdate')) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setValue('birthdate', formatDateISO(date), { shouldValidate: true });
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.birthdate && (
                  <p className="text-sm text-destructive">{errors.birthdate.message}</p>
                )}
              </FormField>
            </FormSection>

            {/* Contact Information */}
            <FormSection title="Contact Information" columns={2}>
              <FormField>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="phoneNumber">WhatsApp Number *</Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder={userType === 'admin' ? '+1234567890' : '+218912345678'}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {userType === 'customer'
                      ? 'Invalid Libyan phone number format. Must be +218 followed by 91-95 and 7 digits'
                      : 'Invalid international phone number format. Must include country code and 6-15 digits'}
                  </p>
                )}
              </FormField>

              <FormField fullWidth>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Minimum 6 characters"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </FormField>
            </FormSection>

            {/* Address */}
            <FormSection title="Address" columns={2}>
              <FormField>
                <Label htmlFor="country">Country *</Label>
                <Select onValueChange={(value) => setValue('address.country', value as any, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.address?.country && (
                  <p className="text-sm text-destructive">{errors.address.country.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="city">City *</Label>
                <CitySearchCombobox
                  cities={availableCities}
                  value={watch('address.city') || ''}
                  onChange={(value) => setValue('address.city', value as any, { shouldValidate: true })}
                  disabled={!selectedCountry}
                  placeholder={selectedCountry ? "Search cities..." : "Select country first"}
                />
                {errors.address?.city && (
                  <p className="text-sm text-destructive">{errors.address.city.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="street">Street (Optional)</Label>
                <Input
                  id="street"
                  {...register('address.street')}
                  placeholder="123 Main Street"
                />
                {errors.address?.street && (
                  <p className="text-sm text-destructive">{errors.address.street.message}</p>
                )}
              </FormField>

              <FormField>
                <Label htmlFor="specificDescription">Location Description (Optional)</Label>
                <Input
                  id="specificDescription"
                  {...register('address.specificDescription')}
                  placeholder="Near the mosque, blue building"
                />
                {errors.address?.specificDescription && (
                  <p className="text-sm text-destructive">{errors.address.specificDescription.message}</p>
                )}
              </FormField>
            </FormSection>

            {/* Privacy Policy */}
            <FormSection title="Account Settings">
              <FormField fullWidth>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacyPolicy"
                    checked={privacyAgreement}
                    onCheckedChange={(checked) =>
                      setValue('privacyPolicy.usageAgreement', !!checked as true, { shouldValidate: true })
                    }
                  />
                  <Label htmlFor="privacyPolicy" className="text-sm font-normal cursor-pointer">
                    I accept the terms and conditions *
                  </Label>
                </div>
                {errors.privacyPolicy?.usageAgreement && (
                  <p className="text-sm text-destructive">{errors.privacyPolicy.usageAgreement.message}</p>
                )}
              </FormField>
            </FormSection>
          </ResponsiveFormLayout>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
