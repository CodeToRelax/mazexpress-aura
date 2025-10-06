import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { X, Mail, Phone, MapPin, Calendar, User as UserIcon, Package, Wallet, Shield } from 'lucide-react';
import type { User } from '@/types/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACLManagementTab } from './ACLManagementTab';

interface UserDetailDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
}

export function UserDetailDialog({ user, open, onClose, onEdit }: UserDetailDialogProps) {
  const { t } = useTranslation();

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  {user.firstName} {user.lastName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.userType === 'admin' ? 'default' : 'secondary'}>
                    {t(`users.table.role.${user.userType}`)}
                  </Badge>
                  <Badge variant={user.disabled ? 'destructive' : 'default'}>
                    {t(`users.table.status.${user.disabled ? 'disabled' : 'active'}`)}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => onEdit(user)}>
              {t('users.actions.edit')}
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className={`grid w-full ${user.userType === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">{t('users.detail.overview')}</TabsTrigger>
            <TabsTrigger value="profile">{t('users.detail.profile')}</TabsTrigger>
            <TabsTrigger value="metadata">{t('users.detail.metadata')}</TabsTrigger>
            {user.userType === 'admin' && (
              <TabsTrigger value="acl">
                <Shield className="h-4 w-4 mr-2" />
                {t('acl:permissions')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-3">
              <h3 className="font-semibold text-lg">{t('users.detail.generalInfo')}</h3>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('users.detail.fields.email')}</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('users.detail.fields.phone')}</div>
                    <div className="font-medium">{user.phoneNumber}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('users.detail.fields.gender')}</div>
                    <div className="font-medium capitalize">{user.gender}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('users.detail.fields.birthdate')}</div>
                    <div className="font-medium">
                      {user.birthdate ? format(new Date(user.birthdate), 'MMMM dd, yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('users.detail.fields.shippingNumber')}</div>
                    <div className="font-medium font-mono">{user.uniqueShippingNumber}</div>
                  </div>
                </div>

                {user.walletId && (
                  <div className="flex items-start gap-3">
                    <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">{t('users.detail.fields.walletId')}</div>
                      <div className="font-medium font-mono text-sm">{user.walletId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-3">
              <h3 className="font-semibold text-lg">{t('users.detail.addressInfo')}</h3>
              <Separator />
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  {user.address.street && (
                    <div>{user.address.street}</div>
                  )}
                  {user.address.specificDescription && (
                    <div className="text-muted-foreground">{user.address.specificDescription}</div>
                  )}
                  <div className="font-medium capitalize">
                    {user.address.city}, {user.address.country}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.firstName')}</label>
                  <div className="font-medium mt-1">{user.firstName}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.lastName')}</label>
                  <div className="font-medium mt-1">{user.lastName}</div>
                </div>
                {user.username && (
                  <div>
                    <label className="text-sm text-muted-foreground">{t('users.detail.fields.username')}</label>
                    <div className="font-medium mt-1">@{user.username}</div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.userType')}</label>
                  <div className="font-medium mt-1 capitalize">{user.userType}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.accountStatus')}</label>
                  <div className="mt-1">
                    <Badge variant={user.disabled ? 'destructive' : 'default'}>
                      {user.disabled ? 'Disabled' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.firebaseId')}</label>
                  <div className="font-mono text-sm mt-1 break-all">{user.firebaseId}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">User ID</label>
                  <div className="font-mono text-sm mt-1 break-all">{user._id}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.createdAt')}</label>
                  <div className="font-medium mt-1">
                    {user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy HH:mm') : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.updatedAt')}</label>
                  <div className="font-medium mt-1">
                    {user.updatedAt ? format(new Date(user.updatedAt), 'MMMM dd, yyyy HH:mm') : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.privacyAgreement')}</label>
                  <div className="mt-1">
                    <Badge variant={user.privacyPolicy.usageAgreement ? 'default' : 'destructive'}>
                      {user.privacyPolicy.usageAgreement ? 'Agreed' : 'Not Agreed'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ACL Management Tab - Only for Admins */}
          {user.userType === 'admin' && (
            <TabsContent value="acl" className="mt-4">
              <ACLManagementTab userId={user._id} userType={user.userType} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
