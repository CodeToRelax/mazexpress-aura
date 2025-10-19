/**
 * ACL (Access Control List) Type Definitions
 * Defines types for permission management and access control
 */

export enum ACLResource {
  USERS = 'users',
  SHIPMENTS = 'shipments',
  WALLET = 'wallet',
  CONFIG = 'config',
  DASHBOARD = 'dashboard',
  REPORTS = 'reports',
}

export enum ACLAction {
  READ = 'read',
  WRITE = 'write',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export interface ACLPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, unknown>;
}

export interface ACLRule {
  resource: string;
  action: string;
  allowed: boolean;
  conditions?: Record<string, unknown>;
}

export interface ACLFlags {
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewShipments: boolean;
  canCreateShipments: boolean;
  canUpdateShipments: boolean;
  canDeleteShipments: boolean;
  canBulkUpdateShipments: boolean;
  canViewShipmentStats: boolean;
  canViewWallet: boolean;
  canManageWallet: boolean;
  canViewDashboard: boolean;
  canManageConfig: boolean;
  canViewReports: boolean;
  canViewWarehouses: boolean;
  canManageWarehouses: boolean;
  canViewInvoices: boolean;
  canCreateInvoices: boolean;
  canManageInvoices: boolean;
}

export interface UserACLData {
  userId: string;
  userType: 'admin' | 'customer';
  permissions: ACLPermission[];
  rules: ACLRule[];
  frontendFlags: ACLFlags;
  adminCountry?: 'libya' | 'turkey' | 'china' | 'uae';
  accessibleStatuses?: string[];
  isSuperAdmin?: boolean;
}

export interface ACLApiResponse {
  success: boolean;
  data: UserACLData;
  message: string;
}

export interface ACLFlagsResponse {
  success: boolean;
  data: ACLFlags;
  message: string;
}

export interface PermissionCheckResponse {
  success: boolean;
  data: {
    resource: string;
    action: string;
    allowed: boolean;
    userType: 'admin' | 'customer';
  };
  message: string;
}

export interface UpdateACLRequest {
  permissions: ACLPermission[];
}

export interface UpdateACLResponse {
  success: boolean;
  data: UserACLData;
  message: string;
}
