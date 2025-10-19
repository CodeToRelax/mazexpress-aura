import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  type?: 'permission' | 'country' | 'status';
  country?: string;
  message?: string;
  showBackButton?: boolean;
}

/**
 * AccessDenied Component
 * Shows context-specific access denied messages
 */
export function AccessDenied({ 
  type = 'permission', 
  country,
  message,
  showBackButton = true 
}: AccessDeniedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getTitle = () => {
    switch (type) {
      case 'country':
        return t('acl.countryRestriction', { defaultValue: 'Country-Based Access Restriction' });
      case 'status':
        return t('acl.noAccessToStatus', { defaultValue: 'Status Access Restricted' });
      default:
        return t('acl.accessDenied', { defaultValue: 'Access Denied' });
    }
  };

  const getDescription = () => {
    if (message) return message;
    
    switch (type) {
      case 'country':
        return country
          ? t('acl.managedByCountry', { 
              country: country.charAt(0).toUpperCase() + country.slice(1),
              defaultValue: `This shipment is managed by ${country.charAt(0).toUpperCase() + country.slice(1)} operations` 
            })
          : t('acl.countryRestrictionGeneric', { 
              defaultValue: 'You don\'t have access to this resource due to country-based restrictions' 
            });
      case 'status':
        return t('acl.noAccessToStatusDesc', { 
          defaultValue: 'You don\'t have permission to access shipments in this status' 
        });
      default:
        return t('acl.accessDeniedDesc', { 
          defaultValue: 'You don\'t have permission to access this resource' 
        });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert variant="destructive" className="max-w-2xl">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold mt-0">
          {getTitle()}
        </AlertTitle>
        <AlertDescription className="mt-3">
          <div className="space-y-4">
            <p>{getDescription()}</p>
            
            <div className="flex items-start gap-2 p-3 bg-background/50 rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                {t('acl.contactSuperAdmin', { 
                  defaultValue: 'If you believe you should have access, please contact your system administrator.' 
                })}
              </p>
            </div>

            {showBackButton && (
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="mt-4"
              >
                {t('actions.back', { defaultValue: 'Go Back' })}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
