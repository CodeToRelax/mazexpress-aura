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

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!acl) return false;
    
    const permission = acl.permissions.find((p) => p.resource === resource);
    return permission?.actions.includes(action) ?? false;
  };

  /**
   * Check if user has a specific frontend flag
   */
  const hasFlag = (flag: keyof ACLFlags): boolean => {
    return flags?.[flag] ?? false;
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
    hasPermission,
    hasFlag,
    canAccessResource,
  };
}
