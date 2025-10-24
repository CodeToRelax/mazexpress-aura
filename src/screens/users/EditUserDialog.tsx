import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import type { User } from '@/types/user';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { usersApi } from '@/utilities/api/users.api';
import { aclApi } from '@/utilities/api/acl.api';
import { updateUserSchema, type UpdateUserFormData } from '@/utilities/zod/user.schemas';
import { ResponsiveFormLayout, FormSection, FormField } from '@/components/layout/ResponsiveFormLayout';
import type { ACLPermission } from '@/types/acl';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateISO } from '@/utilities/helpers/dateHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
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

const ACL_RESOURCES = [
  { resource: 'users', label: 'Users Management', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'shipments', label: 'Shipments', actions: ['read', 'create', 'update'] },
  { resource: 'wallet', label: 'Wallet', actions: ['read', 'manage'] },
  { resource: 'config', label: 'System Config', actions: ['read', 'manage'] },
  { resource: 'reports', label: 'Reports', actions: ['read'] },
  { resource: 'dashboard', label: 'Dashboard', actions: ['read'] },
  { resource: 'warehouses', label: 'Warehouses', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'invoices', label: 'Invoices', actions: ['read', 'create', 'manage'] },
];

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  const [loadingACL, setLoadingACL] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    mode: 'onChange',
  });

  const selectedCountry = watch('address.country');
  const disabledStatus = watch('disabled');
  const userType = watch('userType');

  // Filter cities based on selected country
  const availableCities = selectedCountry ? CITIES_BY_COUNTRY[selectedCountry] || [] : [];

  // Populate form when user changes
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
      setValue('address.street', user.address.street || '');
      setValue('address.specificDescription', user.address.specificDescription || '');
      setValue('userType', user.userType);
      setValue('disabled', user.disabled);
      
      // Load ACL permissions if admin
      if (user.userType === 'admin') {
        setLoadingACL(true);
        aclApi.getUserACLById(user._id)
          .then((aclData) => {
            const permissionsMap: Record<string, string[]> = {};
            aclData.permissions.forEach((perm) => {
              permissionsMap[perm.resource] = perm.actions;
            });
            setSelectedPermissions(permissionsMap);
          })
          .catch((error) => {
            console.error('Failed to load ACL:', error);
          })
          .finally(() => {
            setLoadingACL(false);
          });
      } else {
        setSelectedPermissions({});
      }
    }
  }, [user, open, setValue]);

  // Reset city when country changes
  useEffect(() => {
    if (selectedCountry && user && user.address.country !== selectedCountry) {
      setValue('address.city', '' as any);
    }
  }, [selectedCountry, user, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedPermissions({});
    }
  }, [open, reset]);

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Type assertion: The form data matches UpdateUserData structure
      await usersApi.updateUser(user._id, data as any);
      
      // If admin, update ACL permissions
      if (data.userType === 'admin') {
        const permissionsArray: ACLPermission[] = Object.entries(selectedPermissions)
          .filter(([_, actions]) => actions.length > 0)
          .map(([resource, actions]) => ({ resource, actions }));
        
        if (permissionsArray.length > 0) {
          await aclApi.updateUserACL(user._id, permissionsArray);
        }
      }
      
      toast({
        title: t('users.messages.updateSuccess'),
        description: 'User information updated successfully',
      });
      reset();
      setSelectedPermissions({});
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: t('users.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update user',
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
          <DialogTitle>{t('users.actions.edit')} User</DialogTitle>
          <DialogDescription>
            Update user information. All fields marked with * are required.
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
                  value={watch('userType')}
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
                <Select 
                  value={watch('gender')}
                  onValueChange={(value) => setValue('gender', value as 'male' | 'female', { shouldValidate: true })}
                >
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
            </FormSection>

            {/* Address */}
            <FormSection title="Address" columns={2}>
              <FormField>
                <Label htmlFor="country">Country *</Label>
                <Select 
                  value={watch('address.country')}
                  onValueChange={(value) => setValue('address.country', value as any, { shouldValidate: true })}
                >
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
                <Select 
                  value={watch('address.city')}
                  onValueChange={(value) => setValue('address.city', value as any, { shouldValidate: true })}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Account Settings */}
            <FormSection title="Account Settings" columns={2}>
              <FormField>
                <div className="flex items-center justify-between">
                  <Label htmlFor="disabled">Account Disabled</Label>
                  <Switch
                    id="disabled"
                    checked={disabledStatus}
                    onCheckedChange={(checked) => setValue('disabled', checked, { shouldValidate: true })}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {disabledStatus ? 'User cannot log in' : 'User can log in normally'}
                </p>
              </FormField>
            </FormSection>

            {/* ACL Permissions for Admin Users */}
            {userType === 'admin' && (
              <FormSection title="Admin Permissions" description="Configure access permissions for this administrator">
                <FormField fullWidth>
                  {loadingACL ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ACL_RESOURCES.map(({ resource, label, actions }) => (
                        <div key={resource} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 capitalize">{label}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {actions.map((action) => (
                              <div key={action} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${resource}-${action}`}
                                  checked={selectedPermissions[resource]?.includes(action) ?? false}
                                  onCheckedChange={(checked) => {
                                    setSelectedPermissions(prev => {
                                      const current = prev[resource] || [];
                                      const updated = checked
                                        ? [...current, action]
                                        : current.filter(a => a !== action);
                                      return { ...prev, [resource]: updated };
                                    });
                                  }}
                                />
                                <Label htmlFor={`${resource}-${action}`} className="text-sm capitalize cursor-pointer">
                                  {action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </FormField>
              </FormSection>
            )}
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
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
