import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User as UserIcon, Package, Wallet, Shield, Loader2 } from 'lucide-react';
import type { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACLManagementTab } from './ACLManagementTab';
import { usersApi } from '@/utilities/api/users.api';
import { toast } from '@/hooks/use-toast';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      try {
        const response = await usersApi.getUserById(id);
        setUser(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load user details',
          variant: 'destructive',
        });
        navigate('/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateValue: string | Date | null | undefined, formatString: string): string => {
    if (!dateValue) return 'N/A';
    
    const date = new Date(dateValue);
    
    if (isNaN(date.getTime())) return 'N/A';
    
    return format(date, formatString);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/users')}
            className="glass-card hover:shadow-glass-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
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
        <Button variant="outline" onClick={() => navigate(`/users/${user._id}/edit`)}>
          {t('users.actions.edit')}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
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

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-semibold text-lg">{t('users.detail.generalInfo')}</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {formatDate(user.birthdate, 'MMMM dd, yyyy')}
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

          <div className="glass-card p-6 rounded-2xl space-y-4">
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

        <TabsContent value="profile" className="space-y-4 mt-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <TabsContent value="metadata" className="space-y-4 mt-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {formatDate(user.createdAt, 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.updatedAt')}</label>
                <div className="font-medium mt-1">
                  {formatDate(user.updatedAt, 'MMMM dd, yyyy HH:mm')}
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

        {user.userType === 'admin' && (
          <TabsContent value="acl" className="mt-6">
            <ACLManagementTab userId={user._id} userType={user.userType} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
