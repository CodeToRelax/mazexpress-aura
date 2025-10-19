import { useAppSelector } from '@/utilities/redux';
import {
  selectUserACL,
  selectACLFlags,
  selectACLLoaded,
  selectACLError,
  selectIsAdmin,
} from '@/utilities/redux/acl.slice';
import type { ACLFlags } from '@/types/acl';

/**
 * Hook to access ACL data and permission checks
 * Provides utility functions for checking user permissions
 */
export function useACL() {
  const acl = useAppSelector(selectUserACL);
  const flags = useAppSelector(selectACLFlags);
  const isLoaded = useAppSelector(selectACLLoaded);
  const error = useAppSelector(selectACLError);
  const isAdmin = useAppSelector(selectIsAdmin);
  const adminCountry = useAppSelector((state) => state.acl.acl?.adminCountry);
  const accessibleStatuses = useAppSelector((state) => state.acl.acl?.accessibleStatuses || []);
  const isSuperAdmin = useAppSelector((state) => state.acl.acl?.isSuperAdmin || false);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!acl) {
      console.warn('[useACL] hasPermission called but ACL not loaded:', { resource, action });
      return false;
    }
    
    const permission = acl.permissions.find((p) => p.resource === resource);
    const result = permission?.actions.includes(action) ?? false;
    console.log('[useACL] Permission check:', { resource, action, result, permission });
    return result;
  };

  /**
   * Check if user has a specific frontend flag
   */
  const hasFlag = (flag: keyof ACLFlags): boolean => {
    const result = flags?.[flag] ?? false;
    console.log('[useACL] Flag check:', { flag, result, allFlags: flags });
    return result;
  };

  /**
   * Check if user can perform any action on a resource
   */
  const canAccessResource = (resource: string): boolean => {
    if (!acl) return false;
    
    return acl.permissions.some((p) => p.resource === resource && p.actions.length > 0);
  };

  return {
    acl,
    flags,
    isLoaded,
    error,
    isAdmin,
    isCustomer: acl?.userType === 'customer',
    adminCountry,
    accessibleStatuses,
    isSuperAdmin,
    hasPermission,
    hasFlag,
    canAccessResource,
  };
}
