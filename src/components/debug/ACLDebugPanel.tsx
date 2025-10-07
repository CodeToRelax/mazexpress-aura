import { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useACL } from '@/hooks/useACL';
import { aclApi } from '@/utilities/api/acl.api';
import { useAppDispatch } from '@/utilities/redux';
import { setACL, setACLError } from '@/utilities/redux/acl.slice';
import { toast } from 'sonner';

export function ACLDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { acl, flags, isLoaded, error, isAdmin } = useACL();
  const dispatch = useAppDispatch();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('[ACLDebugPanel] Manually refreshing ACL data...');
      const aclData = await aclApi.getUserACL();
      dispatch(setACL(aclData));
      toast.success('ACL data refreshed');
    } catch (err) {
      console.error('[ACLDebugPanel] Failed to refresh ACL:', err);
      dispatch(setACLError(err instanceof Error ? err.message : 'Failed to refresh'));
      toast.error('Failed to refresh ACL data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-2 shadow-lg"
        >
          <Bug className="h-4 w-4" />
          ACL Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-hidden">
      <Card className="shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              <CardTitle className="text-base">ACL Debug Panel</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Real-time ACL state monitoring</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 overflow-y-auto max-h-[500px]">
          {/* Status */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={isLoaded ? 'default' : 'secondary'}>
                {isLoaded ? 'Loaded' : 'Not Loaded'}
              </Badge>
              {isAdmin && <Badge variant="destructive">Admin</Badge>}
              {acl && (
                <Badge variant="outline">{acl.userType}</Badge>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-destructive">Error</h4>
              <div className="text-xs bg-destructive/10 p-2 rounded border border-destructive/20">
                {error}
              </div>
            </div>
          )}

          {/* User Info */}
          {acl && (
            <div>
              <h4 className="text-sm font-semibold mb-2">User Info</h4>
              <div className="text-xs space-y-1 bg-muted p-2 rounded">
                <div><span className="font-medium">User ID:</span> {acl.userId}</div>
                <div><span className="font-medium">Type:</span> {acl.userType}</div>
                <div><span className="font-medium">Permissions:</span> {acl.permissions.length}</div>
              </div>
            </div>
          )}

          {/* Frontend Flags */}
          {flags && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Frontend Flags</h4>
              <div className="space-y-1">
                {Object.entries(flags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="font-mono">{key}</span>
                    <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                      {value ? '✓' : '✗'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Detail */}
          {acl?.permissions && acl.permissions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Permissions Detail</h4>
              <div className="space-y-2">
                {acl.permissions.map((perm, idx) => (
                  <div key={idx} className="text-xs bg-muted p-2 rounded">
                    <div className="font-medium mb-1">{perm.resource}</div>
                    <div className="flex flex-wrap gap-1">
                      {perm.actions.map((action) => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data */}
          {!acl && isLoaded && !error && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No ACL data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
