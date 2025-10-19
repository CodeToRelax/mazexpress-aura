# 🔐 Complete ACL Implementation Guide for MazExpress Platform

## Table of Contents
1. [Overview](#overview)
2. [Database Schema (Supabase)](#database-schema)
3. [Backend API Requirements](#backend-api-requirements)
4. [Frontend Implementation](#frontend-implementation)
5. [ACL Structure & Permissions](#acl-structure--permissions)
6. [Implementation Checklist](#implementation-checklist)
7. [Testing Scenarios](#testing-scenarios)

---

## Overview

This document provides a complete specification for implementing Role-Based Access Control (RBAC) with fine-grained permissions across the MazExpress platform. The system supports two user types (`admin` and `customer`) with customizable permissions per resource.

### Key Features
- **Resource-based permissions**: Control access to Users, Shipments, Warehouses, Invoices, Wallet, Reports, Settings
- **Action-level control**: Granular permissions (READ, WRITE, CREATE, UPDATE, DELETE, MANAGE)
- **Frontend flags**: Pre-computed permission flags for UI rendering optimization
- **Secure backend validation**: All permissions validated server-side
- **Flexible rules engine**: Support for conditional permissions (future enhancement)

---

## Database Schema (Supabase)

### 1. Create Role Enum

```sql
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'moderator');
```

### 2. Create User Roles Table

```sql
-- User roles table (many-to-many: users can have multiple roles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Add index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### 3. Create ACL Permissions Table

```sql
-- ACL permissions table
CREATE TABLE public.acl_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource VARCHAR(100) NOT NULL, -- 'users', 'shipments', 'wallet', etc.
    actions TEXT[] NOT NULL DEFAULT '{}', -- ['read', 'write', 'create', 'update', 'delete', 'manage']
    conditions JSONB DEFAULT '{}', -- Optional conditions for conditional permissions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, resource)
);

-- Add indexes
CREATE INDEX idx_acl_permissions_user_id ON public.acl_permissions(user_id);
CREATE INDEX idx_acl_permissions_resource ON public.acl_permissions(resource);

-- Enable RLS
ALTER TABLE public.acl_permissions ENABLE ROW LEVEL SECURITY;
```

### 4. Create ACL Rules Table (Optional - for advanced scenarios)

```sql
-- ACL rules table (for fine-grained conditional rules)
CREATE TABLE public.acl_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT false,
    conditions JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 0, -- Higher priority rules take precedence
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX idx_acl_rules_user_id ON public.acl_rules(user_id);
CREATE INDEX idx_acl_rules_resource_action ON public.acl_rules(resource, action);

-- Enable RLS
ALTER TABLE public.acl_rules ENABLE ROW LEVEL SECURITY;
```

### 5. Security Definer Functions (Bypass RLS for ACL checks)

```sql
-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _resource VARCHAR, _action VARCHAR)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.acl_permissions
    WHERE user_id = _user_id
      AND resource = _resource
      AND _action = ANY(actions)
  )
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE (
  resource VARCHAR,
  actions TEXT[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT resource, actions
  FROM public.acl_permissions
  WHERE user_id = _user_id
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;
```

### 6. Row Level Security Policies

```sql
-- ========================================
-- RLS Policies for user_roles table
-- ========================================

-- Users can read their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ========================================
-- RLS Policies for acl_permissions table
-- ========================================

-- Users can read their own permissions
CREATE POLICY "Users can view own permissions"
ON public.acl_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all permissions
CREATE POLICY "Admins can view all permissions"
ON public.acl_permissions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can manage permissions
CREATE POLICY "Admins can manage all permissions"
ON public.acl_permissions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ========================================
-- RLS Policies for acl_rules table
-- ========================================

-- Similar policies for acl_rules
CREATE POLICY "Users can view own rules"
ON public.acl_rules
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rules"
ON public.acl_rules
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all rules"
ON public.acl_rules
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
```

### 7. Trigger for Auto-assigning Default Permissions

```sql
-- Function to assign default permissions when user is created
CREATE OR REPLACE FUNCTION public.assign_default_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type TEXT;
BEGIN
  -- Get user type from metadata (assuming it's stored in raw_user_meta_data)
  user_type := NEW.raw_user_meta_data->>'userType';
  
  -- Assign default role based on user type
  IF user_type = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
    
    -- Assign full admin permissions
    INSERT INTO public.acl_permissions (user_id, resource, actions)
    VALUES
      (NEW.id, 'users', ARRAY['read', 'write', 'create', 'update', 'delete', 'manage']),
      (NEW.id, 'shipments', ARRAY['read', 'write', 'create', 'update', 'delete', 'manage']),
      (NEW.id, 'warehouses', ARRAY['read', 'write', 'create', 'update', 'delete', 'manage']),
      (NEW.id, 'invoices', ARRAY['read', 'write', 'create', 'update', 'delete', 'manage']),
      (NEW.id, 'wallet', ARRAY['read', 'write', 'manage']),
      (NEW.id, 'reports', ARRAY['read']),
      (NEW.id, 'dashboard', ARRAY['read']),
      (NEW.id, 'config', ARRAY['read', 'write', 'manage']);
  ELSE
    -- Customer role with limited permissions
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer'::app_role);
    
    -- Assign customer permissions (read-only for their own data)
    INSERT INTO public.acl_permissions (user_id, resource, actions)
    VALUES
      (NEW.id, 'shipments', ARRAY['read']),
      (NEW.id, 'wallet', ARRAY['read']),
      (NEW.id, 'dashboard', ARRAY['read']),
      (NEW.id, 'invoices', ARRAY['read']);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created_assign_permissions
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.assign_default_permissions();
```

### 8. Utility Functions for Backend

```sql
-- Function to compute frontend flags (for optimization)
CREATE OR REPLACE FUNCTION public.compute_acl_flags(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flags JSONB := '{}'::jsonb;
  user_permissions RECORD;
BEGIN
  -- Get all user permissions
  FOR user_permissions IN
    SELECT resource, actions
    FROM public.acl_permissions
    WHERE user_id = _user_id
  LOOP
    -- Users
    IF user_permissions.resource = 'users' THEN
      flags := flags || jsonb_build_object(
        'canViewUsers', 'read' = ANY(user_permissions.actions),
        'canManageUsers', 'manage' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Shipments
    IF user_permissions.resource = 'shipments' THEN
      flags := flags || jsonb_build_object(
        'canViewShipments', 'read' = ANY(user_permissions.actions),
        'canCreateShipments', 'create' = ANY(user_permissions.actions),
        'canUpdateShipments', 'update' = ANY(user_permissions.actions),
        'canDeleteShipments', 'delete' = ANY(user_permissions.actions),
        'canBulkUpdateShipments', 'manage' = ANY(user_permissions.actions) OR 'update' = ANY(user_permissions.actions),
        'canViewShipmentStats', 'read' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Warehouses
    IF user_permissions.resource = 'warehouses' THEN
      flags := flags || jsonb_build_object(
        'canViewWarehouses', 'read' = ANY(user_permissions.actions),
        'canManageWarehouses', 'manage' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Invoices
    IF user_permissions.resource = 'invoices' THEN
      flags := flags || jsonb_build_object(
        'canViewInvoices', 'read' = ANY(user_permissions.actions),
        'canCreateInvoices', 'create' = ANY(user_permissions.actions),
        'canManageInvoices', 'manage' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Wallet
    IF user_permissions.resource = 'wallet' THEN
      flags := flags || jsonb_build_object(
        'canViewWallet', 'read' = ANY(user_permissions.actions),
        'canManageWallet', 'manage' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Dashboard
    IF user_permissions.resource = 'dashboard' THEN
      flags := flags || jsonb_build_object(
        'canViewDashboard', 'read' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Config/Settings
    IF user_permissions.resource = 'config' THEN
      flags := flags || jsonb_build_object(
        'canManageConfig', 'manage' = ANY(user_permissions.actions)
      );
    END IF;
    
    -- Reports
    IF user_permissions.resource = 'reports' THEN
      flags := flags || jsonb_build_object(
        'canViewReports', 'read' = ANY(user_permissions.actions)
      );
    END IF;
  END LOOP;
  
  RETURN flags;
END;
$$;
```

---

## Backend API Requirements

Your backend (Node.js/Express or similar) needs to implement these endpoints:

### Authentication Middleware

```typescript
// middleware/auth.ts
import { auth } from 'firebase-admin';

export async function authenticateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decodedToken = await auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

### ACL Endpoints

#### 1. GET `/api/acl/user` - Get Current User's ACL

**Response:**
```typescript
{
  "success": true,
  "data": {
    "userId": "uuid",
    "userType": "admin" | "customer",
    "permissions": [
      {
        "resource": "users",
        "actions": ["read", "write", "create", "update", "delete", "manage"],
        "conditions": {}
      }
    ],
    "rules": [], // Optional advanced rules
    "frontendFlags": {
      "canViewUsers": true,
      "canManageUsers": true,
      // ... all flags
    }
  },
  "message": "ACL retrieved successfully"
}
```

**Implementation:**
```typescript
// routes/acl.ts
router.get('/api/acl/user', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user type from your users table
    const { data: user } = await supabase
      .from('users')
      .select('userType')
      .eq('firebaseId', userId)
      .single();
    
    // Get permissions
    const { data: permissions } = await supabase
      .from('acl_permissions')
      .select('resource, actions, conditions')
      .eq('user_id', userId);
    
    // Get rules (optional)
    const { data: rules } = await supabase
      .from('acl_rules')
      .select('resource, action, allowed, conditions, priority')
      .eq('user_id', userId)
      .order('priority', { ascending: false });
    
    // Compute frontend flags using the SQL function
    const { data: flagsResult } = await supabase
      .rpc('compute_acl_flags', { _user_id: userId });
    
    const response = {
      success: true,
      data: {
        userId,
        userType: user.userType,
        permissions: permissions || [],
        rules: rules || [],
        frontendFlags: flagsResult || getDefaultFlags(),
      },
      message: 'ACL retrieved successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching ACL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ACL',
    });
  }
});

function getDefaultFlags() {
  return {
    canViewUsers: false,
    canManageUsers: false,
    canViewShipments: false,
    canCreateShipments: false,
    canUpdateShipments: false,
    canDeleteShipments: false,
    canBulkUpdateShipments: false,
    canViewShipmentStats: false,
    canViewWallet: false,
    canManageWallet: false,
    canViewDashboard: false,
    canManageConfig: false,
    canViewReports: false,
    canViewWarehouses: false,
    canManageWarehouses: false,
    canViewInvoices: false,
    canCreateInvoices: false,
    canManageInvoices: false,
  };
}
```

#### 2. GET `/api/acl/flags` - Get Lightweight Flags Only

**Response:**
```typescript
{
  "success": true,
  "data": {
    "canViewUsers": true,
    "canManageUsers": false,
    // ... all flags
  },
  "message": "ACL flags retrieved successfully"
}
```

#### 3. GET `/api/acl/check?resource=users&action=read` - Check Specific Permission

**Response:**
```typescript
{
  "success": true,
  "data": {
    "resource": "users",
    "action": "read",
    "allowed": true,
    "userType": "admin"
  },
  "message": "Permission check successful"
}
```

**Implementation:**
```typescript
router.get('/api/acl/check', authenticateUser, async (req, res) => {
  try {
    const { resource, action } = req.query;
    const userId = req.userId;
    
    // Use the has_permission function
    const { data: allowed } = await supabase
      .rpc('has_permission', {
        _user_id: userId,
        _resource: resource,
        _action: action,
      });
    
    const { data: user } = await supabase
      .from('users')
      .select('userType')
      .eq('firebaseId', userId)
      .single();
    
    res.json({
      success: true,
      data: {
        resource,
        action,
        allowed: allowed || false,
        userType: user?.userType || 'customer',
      },
      message: 'Permission check successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Permission check failed',
    });
  }
});
```

#### 4. GET `/api/acl/user/:userId` - Get ACL for Specific User (Admin Only)

Requires admin permission check.

#### 5. PATCH `/api/acl/user/:userId` - Update User Permissions (Admin Only)

**Request Body:**
```typescript
{
  "permissions": [
    {
      "resource": "shipments",
      "actions": ["read", "create"],
      "conditions": {}
    }
  ]
}
```

**Implementation:**
```typescript
router.patch('/api/acl/user/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { permissions } = req.body;
    const adminUserId = req.userId;
    
    // Check if requesting user is admin
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { _user_id: adminUserId });
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update permissions',
      });
    }
    
    // Delete existing permissions for this user
    await supabase
      .from('acl_permissions')
      .delete()
      .eq('user_id', targetUserId);
    
    // Insert new permissions
    const permissionsToInsert = permissions.map(p => ({
      user_id: targetUserId,
      resource: p.resource,
      actions: p.actions,
      conditions: p.conditions || {},
      created_by: adminUserId,
    }));
    
    const { data: newPermissions, error } = await supabase
      .from('acl_permissions')
      .insert(permissionsToInsert)
      .select();
    
    if (error) throw error;
    
    // Get updated ACL
    const { data: flagsResult } = await supabase
      .rpc('compute_acl_flags', { _user_id: targetUserId });
    
    res.json({
      success: true,
      data: {
        userId: targetUserId,
        permissions: newPermissions,
        frontendFlags: flagsResult,
      },
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
    });
  }
});
```

### Permission Validation Middleware

Use this middleware to protect your endpoints:

```typescript
// middleware/checkPermission.ts
export function requirePermission(resource: string, action: string) {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      
      const { data: allowed } = await supabase
        .rpc('has_permission', {
          _user_id: userId,
          _resource: resource,
          _action: action,
        });
      
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${action} on ${resource}`,
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
}

// Usage example:
router.get('/api/users', 
  authenticateUser, 
  requirePermission('users', 'read'),
  async (req, res) => {
    // Handler code
  }
);

router.post('/api/shipments',
  authenticateUser,
  requirePermission('shipments', 'create'),
  async (req, res) => {
    // Handler code
  }
);
```

---

## Frontend Implementation

The frontend is already mostly set up! Here's what you have:

### 1. Redux Slice (`src/utilities/redux/acl.slice.ts`)

Already implemented. Key actions:
- `loadUserACL()` - Load ACL on app initialization
- `refreshACL()` - Refresh ACL data
- `clearACL()` - Clear on logout

### 2. ACL Hook (`src/hooks/useACL.ts`)

Already implemented. Usage:
```typescript
const { 
  flags,           // Frontend permission flags
  isAdmin,         // Boolean for admin check
  isCustomer,      // Boolean for customer check
  hasPermission,   // Function: hasPermission('users', 'read')
  hasFlag,         // Function: hasFlag('canViewUsers')
  isLoaded,        // Boolean: ACL data loaded
  error            // Error state
} = useACL();
```

### 3. ACL Guard Component (`src/components/guards/ACLGuard.tsx`)

Use to conditionally render components:

```typescript
import { ACLGuard } from '@/components/guards/ACLGuard';

// By permission
<ACLGuard resource="users" action="read">
  <UsersTable />
</ACLGuard>

// By flag (faster)
<ACLGuard flag="canViewUsers">
  <UsersTable />
</ACLGuard>

// With fallback
<ACLGuard flag="canManageUsers" fallback={<AccessDenied />}>
  <UserManagementPanel />
</ACLGuard>
```

### 4. Loading ACL on App Init

In your `App.tsx` or main auth component:

```typescript
import { useEffect } from 'react';
import { useAppDispatch } from '@/utilities/redux';
import { loadUserACL } from '@/utilities/redux/acl.slice';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Load ACL when user is authenticated
      dispatch(loadUserACL());
    }
  }, [user, dispatch]);
  
  return <YourApp />;
}
```

### 5. Protecting Routes

```typescript
import { Navigate } from 'react-router-dom';
import { useACL } from '@/hooks/useACL';

function ProtectedRoute({ children, requiredFlag }) {
  const { flags, isLoaded } = useACL();
  
  if (!isLoaded) return <PageLoader />;
  
  if (!flags[requiredFlag]) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

// Usage in routes
<Route path="/users" element={
  <ProtectedRoute requiredFlag="canViewUsers">
    <Users />
  </ProtectedRoute>
} />
```

### 6. Conditional UI Elements

```typescript
import { useACL } from '@/hooks/useACL';

function ShipmentsToolbar() {
  const { flags } = useACL();
  
  return (
    <div className="flex gap-2">
      {flags.canViewShipments && <ViewButton />}
      {flags.canCreateShipments && <CreateButton />}
      {flags.canDeleteShipments && <DeleteButton />}
      {flags.canBulkUpdateShipments && <BulkUpdateButton />}
    </div>
  );
}
```

### 7. Navigation Items

Update `src/data/navigation.tsx`:

```typescript
import { ACLResource } from '@/types/acl';

export const navigationItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    requiredFlag: 'canViewDashboard',
  },
  {
    label: 'Users',
    icon: Users,
    path: '/users',
    requiredFlag: 'canViewUsers',
  },
  {
    label: 'Shipments',
    icon: Package,
    path: '/shipments',
    requiredFlag: 'canViewShipments',
  },
  {
    label: 'Warehouses',
    icon: Warehouse,
    path: '/warehouses',
    requiredFlag: 'canViewWarehouses',
  },
  {
    label: 'Invoices',
    icon: FileText,
    path: '/invoices',
    requiredFlag: 'canViewInvoices',
  },
  {
    label: 'Wallet',
    icon: Wallet,
    path: '/wallet',
    requiredFlag: 'canViewWallet',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    requiredFlag: 'canManageConfig',
  },
];

// In Sidenav.tsx
import { useACL } from '@/hooks/useACL';

function Sidenav() {
  const { flags, isLoaded } = useACL();
  
  const visibleItems = navigationItems.filter(item => {
    if (!item.requiredFlag) return true;
    return flags[item.requiredFlag];
  });
  
  return (
    <nav>
      {visibleItems.map(item => (
        <NavItem key={item.path} {...item} />
      ))}
    </nav>
  );
}
```

---

## ACL Structure & Permissions

### Resources

```typescript
enum ACLResource {
  USERS = 'users',
  SHIPMENTS = 'shipments',
  WAREHOUSES = 'warehouses',
  INVOICES = 'invoices',
  WALLET = 'wallet',
  CONFIG = 'config',
  DASHBOARD = 'dashboard',
  REPORTS = 'reports',
}
```

### Actions

```typescript
enum ACLAction {
  READ = 'read',        // View/list resources
  WRITE = 'write',      // Modify resources (generic)
  CREATE = 'create',    // Create new resources
  UPDATE = 'update',    // Update existing resources
  DELETE = 'delete',    // Delete resources
  MANAGE = 'manage',    // Full control (includes all above)
}
```

### Default Permission Sets

#### Admin (Full Access)
```typescript
const adminPermissions = [
  { resource: 'users', actions: ['read', 'write', 'create', 'update', 'delete', 'manage'] },
  { resource: 'shipments', actions: ['read', 'write', 'create', 'update', 'delete', 'manage'] },
  { resource: 'warehouses', actions: ['read', 'write', 'create', 'update', 'delete', 'manage'] },
  { resource: 'invoices', actions: ['read', 'write', 'create', 'update', 'delete', 'manage'] },
  { resource: 'wallet', actions: ['read', 'write', 'manage'] },
  { resource: 'reports', actions: ['read'] },
  { resource: 'dashboard', actions: ['read'] },
  { resource: 'config', actions: ['read', 'write', 'manage'] },
];
```

#### Customer (Limited Access)
```typescript
const customerPermissions = [
  { resource: 'shipments', actions: ['read'], conditions: { ownedBy: 'self' } },
  { resource: 'invoices', actions: ['read'], conditions: { ownedBy: 'self' } },
  { resource: 'wallet', actions: ['read'], conditions: { ownedBy: 'self' } },
  { resource: 'dashboard', actions: ['read'] },
];
```

#### Moderator (Partial Admin)
```typescript
const moderatorPermissions = [
  { resource: 'users', actions: ['read'] },
  { resource: 'shipments', actions: ['read', 'create', 'update'] },
  { resource: 'warehouses', actions: ['read'] },
  { resource: 'invoices', actions: ['read', 'create'] },
  { resource: 'wallet', actions: ['read'] },
  { resource: 'reports', actions: ['read'] },
  { resource: 'dashboard', actions: ['read'] },
];
```

### Frontend Flags Mapping

```typescript
const flagMappings = {
  // Users
  canViewUsers: { resource: 'users', action: 'read' },
  canManageUsers: { resource: 'users', action: 'manage' },
  
  // Shipments
  canViewShipments: { resource: 'shipments', action: 'read' },
  canCreateShipments: { resource: 'shipments', action: 'create' },
  canUpdateShipments: { resource: 'shipments', action: 'update' },
  canDeleteShipments: { resource: 'shipments', action: 'delete' },
  canBulkUpdateShipments: { resource: 'shipments', actions: ['update', 'manage'] },
  canViewShipmentStats: { resource: 'shipments', action: 'read' },
  
  // Warehouses
  canViewWarehouses: { resource: 'warehouses', action: 'read' },
  canManageWarehouses: { resource: 'warehouses', action: 'manage' },
  
  // Invoices
  canViewInvoices: { resource: 'invoices', action: 'read' },
  canCreateInvoices: { resource: 'invoices', action: 'create' },
  canManageInvoices: { resource: 'invoices', action: 'manage' },
  
  // Wallet
  canViewWallet: { resource: 'wallet', action: 'read' },
  canManageWallet: { resource: 'wallet', action: 'manage' },
  
  // Dashboard
  canViewDashboard: { resource: 'dashboard', action: 'read' },
  
  // Config/Settings
  canManageConfig: { resource: 'config', action: 'manage' },
  
  // Reports
  canViewReports: { resource: 'reports', action: 'read' },
};
```

---

## Implementation Checklist

### Phase 1: Database Setup ✅
- [ ] Create `app_role` enum
- [ ] Create `user_roles` table with RLS
- [ ] Create `acl_permissions` table with RLS
- [ ] Create `acl_rules` table (optional) with RLS
- [ ] Create security definer functions (`has_role`, `has_permission`, `is_admin`, etc.)
- [ ] Create RLS policies for all ACL tables
- [ ] Create `assign_default_permissions()` trigger
- [ ] Create `compute_acl_flags()` function
- [ ] Test database functions in Supabase SQL Editor

### Phase 2: Backend API ✅
- [ ] Implement authentication middleware
- [ ] Implement `GET /api/acl/user` endpoint
- [ ] Implement `GET /api/acl/flags` endpoint
- [ ] Implement `GET /api/acl/check` endpoint
- [ ] Implement `GET /api/acl/user/:userId` (admin only)
- [ ] Implement `PATCH /api/acl/user/:userId` (admin only)
- [ ] Create `requirePermission()` middleware
- [ ] Protect existing endpoints with permission checks
- [ ] Test all endpoints with Postman/Thunder Client

### Phase 3: Frontend Integration ✅ (Mostly Done)
- [ ] Verify Redux ACL slice is working
- [ ] Verify `useACL` hook is working
- [ ] Verify `ACLGuard` component is working
- [ ] Load ACL on app initialization (in App.tsx)
- [ ] Clear ACL on logout
- [ ] Add ACL checks to navigation items
- [ ] Protect routes with ACL guards
- [ ] Add conditional rendering to UI buttons/actions
- [ ] Add loading states while ACL is loading
- [ ] Test with different user roles

### Phase 4: UI Components for ACL Management
- [ ] Create "Manage Permissions" page (for admins)
- [ ] Add permission editor component
- [ ] Add role assignment UI
- [ ] Add permission preview/debugging panel
- [ ] Add audit log for permission changes (optional)

### Phase 5: Testing & Validation
- [ ] Test admin user with full permissions
- [ ] Test customer user with limited permissions
- [ ] Test permission denial (403 errors)
- [ ] Test ACL refresh after permission changes
- [ ] Test concurrent users with different permissions
- [ ] Test conditional permissions (if implemented)
- [ ] Performance test with large permission sets
- [ ] Security audit (penetration testing)

### Phase 6: Documentation & Training
- [ ] Document permission structure
- [ ] Create admin guide for managing permissions
- [ ] Create developer guide for adding new resources
- [ ] Add inline code comments
- [ ] Create video tutorial (optional)

---

## Testing Scenarios

### Scenario 1: Admin Full Access
**Setup:**
- Create admin user
- Assign admin role via database

**Test:**
1. Login as admin
2. Verify all navigation items visible
3. Verify can view users list
4. Verify can create/edit/delete shipments
5. Verify can access settings
6. Verify can manage warehouses
7. Verify can view invoices

**Expected:** All actions allowed

### Scenario 2: Customer Limited Access
**Setup:**
- Create customer user
- Assign customer role

**Test:**
1. Login as customer
2. Verify only Dashboard, Shipments, Invoices, Wallet visible in nav
3. Verify cannot see Users page
4. Verify cannot see Settings
5. Verify can only view own shipments (filtered by userId)
6. Verify cannot create/delete shipments
7. Try accessing `/users` directly → should redirect to 403

**Expected:** Limited access, proper restrictions

### Scenario 3: Permission Update
**Setup:**
- Create customer user
- Admin updates permissions to grant 'create' on shipments

**Test:**
1. Login as customer (before update)
2. Verify "Create Shipment" button hidden
3. Admin updates permissions
4. Customer clicks "Refresh" or reloads page
5. Verify "Create Shipment" button now visible
6. Create a shipment successfully

**Expected:** Permissions update in real-time

### Scenario 4: Unauthorized Access
**Setup:**
- Customer user without 'delete' permission on shipments

**Test:**
1. Login as customer
2. Manually call `DELETE /api/shipments/:id` via console
3. Backend should return 403 Forbidden
4. Try accessing admin-only route `/settings`
5. Should redirect to 403 or home

**Expected:** All unauthorized actions blocked

### Scenario 5: ACL Loading States
**Setup:**
- Slow network simulation

**Test:**
1. Login as user
2. ACL should show loading spinner/skeleton
3. Navigation should be disabled or show loading
4. After ACL loads, UI updates with correct permissions
5. If ACL fails to load, show error state

**Expected:** Graceful loading and error handling

### Scenario 6: Conditional Permissions (Advanced)
**Setup:**
- User has permission to update shipments only if `status === 'pending'`

**Test:**
1. Try updating pending shipment → Success
2. Try updating delivered shipment → 403 Forbidden

**Expected:** Condition-based access control works

---

## Additional Resources

### Database Migration Script
Create a file `migrations/001_acl_setup.sql` with all the SQL from Section 2.

### Seed Data for Testing
```sql
-- Create test admin
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@test.com', '{"userType": "admin"}'::jsonb);

-- Create test customer
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'customer@test.com', '{"userType": "customer"}'::jsonb);
```

### Backend Environment Variables
```env
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Frontend Environment Variables
```env
# .env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Troubleshooting

### Issue: ACL not loading
**Solution:** 
- Check network tab for 401/403 errors
- Verify Firebase token is valid
- Check backend logs for errors
- Verify Supabase RLS policies allow access

### Issue: Permissions not updating
**Solution:**
- Call `dispatch(refreshACL())` after permission changes
- Check if backend is returning updated data
- Verify Redux store is being updated
- Clear browser cache

### Issue: RLS policy blocking access
**Solution:**
- Use security definer functions to bypass RLS
- Check if `is_admin()` function works correctly
- Verify user_id matches in database

### Issue: Performance issues
**Solution:**
- Cache ACL in Redis (backend)
- Use `compute_acl_flags()` instead of computing in application
- Add database indexes on frequently queried columns
- Use frontend flags instead of `hasPermission()` for UI rendering

---

## Next Steps

1. **Run the database migrations** in Supabase SQL Editor
2. **Implement backend API endpoints** following the specifications
3. **Test with Postman** to verify endpoints work
4. **Integrate frontend** (mostly done, just need to load ACL)
5. **Create admin UI** for managing permissions
6. **Deploy and monitor**

## Security Best Practices

1. ✅ **Never trust client-side**: Always validate permissions on backend
2. ✅ **Use security definer functions**: Bypass RLS for ACL checks
3. ✅ **Audit permission changes**: Log who changed what and when
4. ✅ **Principle of least privilege**: Start with minimal permissions
5. ✅ **Regular security audits**: Review permissions quarterly
6. ✅ **Rate limiting**: Protect ACL endpoints from abuse
7. ✅ **Token expiration**: Refresh ACL when token refreshes

---

## Questions?

This guide covers the complete ACL implementation. If you need clarification on any section or want to extend functionality (e.g., team-based permissions, time-based access), let me know!

**Total Implementation Time Estimate:** 
- Database: 2-3 hours
- Backend: 4-6 hours  
- Frontend Integration: 2-3 hours
- Testing: 3-4 hours
- **Total: 11-16 hours**

Good luck! 🚀
