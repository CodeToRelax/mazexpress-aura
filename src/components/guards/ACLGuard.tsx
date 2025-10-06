import React from 'react';
import { useACL } from '@/hooks/useACL';
import type { ACLFlags } from '@/types/acl';

interface ACLGuardProps {
  children: React.ReactNode;
  resource?: string;
  action?: string;
  flag?: keyof ACLFlags;
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ACL Guard Component
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * - <ACLGuard flag="canViewUsers">...</ACLGuard>
 * - <ACLGuard resource="users" action="delete">...</ACLGuard>
 * - <ACLGuard requireAdmin>...</ACLGuard>
 */
export function ACLGuard({
  children,
  resource,
  action,
  flag,
  fallback = null,
  requireAdmin = false,
}: ACLGuardProps) {
  const { hasPermission, hasFlag, isAdmin, isLoaded } = useACL();

  // Wait for ACL to load
  if (!isLoaded) {
    return null;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  // Check specific permission
  if (resource && action) {
    return hasPermission(resource, action) ? <>{children}</> : <>{fallback}</>;
  }

  // Check frontend flag
  if (flag) {
    return hasFlag(flag) ? <>{children}</> : <>{fallback}</>;
  }

  // Default: render children
  return <>{children}</>;
}
