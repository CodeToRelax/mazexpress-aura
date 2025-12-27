import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  User as UserIcon,
  Globe,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/utilities/redux';
import { useACL } from '@/hooks/useACL';
import { usersApi } from '@/utilities/api/users.api';
import { User } from '@/types/user';
import { format } from 'date-fns';

export default function MyProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAppSelector((state) => state.auth);
  const { acl, isSuperAdmin } = useACL();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!acl?.userId) return;
      
      try {
        const response = await usersApi.getUserById(acl.userId);
        if (response.success) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [acl?.userId]);

  const displayName = profile 
    ? `${profile.firstName} ${profile.lastName}`
    : firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Admin';
  
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const userType = isSuperAdmin ? t('acl.superAdmin') : t('users.table.role.admin');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('profile.subtitle')}</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent h-24" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground">{firebaseUser?.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Shield className="h-3 w-3 mr-1" />
                  {userType}
                </Badge>
                {acl?.adminCountry && (
                  <Badge variant="outline" className="capitalize">
                    <Globe className="h-3 w-3 mr-1" />
                    {acl.adminCountry}
                  </Badge>
                )}
                {isSuperAdmin && (
                  <Badge variant="secondary">
                    {t('acl.allAccess')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5 text-primary" />
              {t('profile.sections.accountInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow 
              icon={<Mail className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.email')}
              value={firebaseUser?.email || '-'}
            />
            <InfoRow 
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.phone')}
              value={profile?.phoneNumber || '-'}
            />
            <InfoRow 
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.adminCountry')}
              value={acl?.adminCountry ? (
                <span className="capitalize">{acl.adminCountry}</span>
              ) : '-'}
            />
            <InfoRow 
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.createdAt')}
              value={profile?.createdAt 
                ? format(new Date(profile.createdAt), 'PPP')
                : '-'
              }
            />
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {t('profile.sections.addressInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow 
              icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.city')}
              value={profile?.address?.city || '-'}
            />
            <InfoRow 
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.country')}
              value={profile?.address?.country ? (
                <span className="capitalize">{profile.address.country}</span>
              ) : '-'}
            />
            <InfoRow 
              icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
              label={t('profile.fields.street')}
              value={profile?.address?.street || '-'}
            />
            {profile?.address?.specificDescription && (
              <InfoRow 
                icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                label={t('profile.fields.locationDescription')}
                value={profile.address.specificDescription}
              />
            )}
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              {t('profile.sections.security')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SecurityCard 
                icon={<Clock className="h-5 w-5" />}
                label={t('profile.fields.lastSignIn')}
                value={firebaseUser?.metadata?.lastSignInTime 
                  ? format(new Date(firebaseUser.metadata.lastSignInTime), 'PPp')
                  : '-'
                }
              />
              <SecurityCard 
                icon={<CheckCircle className="h-5 w-5" />}
                label={t('profile.fields.accountStatus')}
                value={
                  <Badge variant={profile?.disabled ? 'destructive' : 'default'} className="mt-1">
                    {profile?.disabled 
                      ? t('users.table.status.disabled')
                      : t('users.table.status.active')
                    }
                  </Badge>
                }
              />
              <SecurityCard 
                icon={<UserIcon className="h-5 w-5" />}
                label={t('profile.fields.shippingNumber')}
                value={profile?.uniqueShippingNumber || '-'}
              />
              <SecurityCard 
                icon={<Calendar className="h-5 w-5" />}
                label={t('profile.fields.memberSince')}
                value={firebaseUser?.metadata?.creationTime 
                  ? format(new Date(firebaseUser.metadata.creationTime), 'PP')
                  : '-'
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

interface SecurityCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function SecurityCard({ icon, label, value }: SecurityCardProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
