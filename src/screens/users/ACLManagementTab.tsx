import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { aclApi } from '@/utilities/api/acl.api';
import type { ACLPermission, ACLFlags } from '@/types/acl';

interface ACLManagementTabProps {
  userId: string;
  userType: 'admin' | 'customer';
}

// Define resources and their available actions
const ACL_RESOURCES = [
  {
    resource: 'users',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    resource: 'shipments',
    actions: ['read', 'create', 'update'],
  },
  {
    resource: 'wallet',
    actions: ['read', 'manage'],
  },
  {
    resource: 'config',
    actions: ['read', 'manage'],
  },
  {
    resource: 'reports',
    actions: ['read'],
  },
  {
    resource: 'dashboard',
    actions: ['read'],
  },
];

export function ACLManagementTab({ userId, userType }: ACLManagementTabProps) {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewFlags, setPreviewFlags] = useState<Partial<ACLFlags>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user's current ACL
  useEffect(() => {
    const fetchACL = async () => {
      try {
        setLoading(true);
        const aclData = await aclApi.getUserACLById(userId);
        
        // Convert permissions array to object for easier manipulation
        const permissionsMap: Record<string, string[]> = {};
        aclData.permissions.forEach((perm) => {
          permissionsMap[perm.resource] = perm.actions;
        });
        
        setPermissions(permissionsMap);
        setPreviewFlags(aclData.frontendFlags);
      } catch (error) {
        console.error('Failed to fetch ACL:', error);
        toast.error(t('acl:loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (userType === 'admin') {
      fetchACL();
    }
  }, [userId, userType, t]);

  // Handle checkbox change
  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissions((prev) => {
      const current = prev[resource] || [];
      const updated = checked
        ? [...current, action]
        : current.filter((a) => a !== action);
      
      return {
        ...prev,
        [resource]: updated,
      };
    });
    setHasChanges(true);
  };

  // Check if action is selected
  const isActionSelected = (resource: string, action: string): boolean => {
    return permissions[resource]?.includes(action) ?? false;
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert permissions map to array
      const permissionsArray: ACLPermission[] = Object.entries(permissions)
        .filter(([_, actions]) => actions.length > 0)
        .map(([resource, actions]) => ({
          resource,
          actions,
        }));

      // Validate at least one permission
      if (permissionsArray.length === 0) {
        toast.error(t('acl:messages.atLeastOnePermission'));
        return;
      }

      await aclApi.updateUserACL(userId, permissionsArray);
      toast.success(t('acl:updateSuccess'));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update ACL:', error);
      toast.error(t('acl:updateError'));
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = async () => {
    try {
      setLoading(true);
      const aclData = await aclApi.getUserACLById(userId);
      
      const permissionsMap: Record<string, string[]> = {};
      aclData.permissions.forEach((perm) => {
        permissionsMap[perm.resource] = perm.actions;
      });
      
      setPermissions(permissionsMap);
      setHasChanges(false);
      toast.success('Permissions reset');
    } catch (error) {
      console.error('Failed to reset ACL:', error);
      toast.error('Failed to reset permissions');
    } finally {
      setLoading(false);
    }
  };

  if (userType !== 'admin') {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          {t('acl:noPermissions')}
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('acl:managePermissions')}</h3>
          <p className="text-sm text-muted-foreground">
            Configure access permissions for this administrator
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Permissions Grid */}
      <Accordion type="multiple" className="space-y-2" defaultValue={['users', 'shipments']}>
        {ACL_RESOURCES.map(({ resource, actions }) => (
          <AccordionItem key={resource} value={resource} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">{t(`acl:resources.${resource}.label`)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(`acl:resources.${resource}.description`)}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {actions.map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${resource}-${action}`}
                      checked={isActionSelected(resource, action)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(resource, action, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`${resource}-${action}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {t(`acl:actions.${action}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Preview</CardTitle>
          <CardDescription>
            Frontend access flags based on current permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(previewFlags).map(([flag, enabled]) => (
              <div
                key={flag}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                  enabled ? 'bg-primary/10 border-primary/20' : 'bg-muted'
                }`}
              >
                {enabled ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className="text-sm">{flag.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
