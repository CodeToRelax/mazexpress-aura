import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Plus, Download, Trash2, RotateCw } from 'lucide-react';
import type { User, UserFilters, UserType } from '@/types/user';
import { usersApi } from '@/utilities/api/users.api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { UsersTable } from './UsersTable';
import { UsersFilters, ActiveFiltersBadges } from './UsersFilters';
import { UsersPagination } from './UsersPagination';
import { ColumnVisibilityToggle } from './ColumnVisibilityToggle';
import { UsersStatsBar } from './UsersStatsBar';
import { DeleteUserDialog } from './DeleteUserDialog';
import { DeactivateUserDialog } from './DeactivateUserDialog';

// localStorage keys
const STORAGE_KEYS = {
  VISIBLE_COLUMNS: 'users-visible-columns',
  FILTERS: 'users-filters',
  TABLE_LIMIT: 'users-table-limit',
};

export default function Users() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<UserType>(
    (searchParams.get('tab') as UserType) || 'customer'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  });
  
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });

  // Initialize from localStorage
  const [filters, setFilters] = useState<UserFilters>(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      const savedLimit = localStorage.getItem(STORAGE_KEYS.TABLE_LIMIT);
      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      
      return {
        page: 1,
        limit: savedLimit ? parseInt(savedLimit) : 10,
        userType: activeTab,
        sortBy: parsedFilters.sortBy || 'createdAt',
        sortOrder: parsedFilters.sortOrder || 'desc',
        disabled: parsedFilters.disabled,
        gender: parsedFilters.gender,
        country: parsedFilters.country,
        createdAfter: parsedFilters.createdAfter,
        createdBefore: parsedFilters.createdBefore,
      };
    } catch {
      return {
        page: 1,
        limit: 10,
        userType: activeTab,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    }
  });

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISIBLE_COLUMNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch {}
    return new Set(['email', 'phone', 'role', 'status', 'country', 'joined']);
  });

  const fetchUsers = useCallback(async () => {
    console.log('fetchUsers called with filters:', filters);
    try {
      setLoading(true);
      setHasError(false);
      setErrorMessage('');
      const response = await usersApi.getUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setHasError(true);
      setErrorMessage(message);
      
      // Only show toast if it's not a 404 (backend not ready)
      if (!message.includes('404')) {
        toast({
          title: t('users.messages.error'),
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await usersApi.getStats();
      setUserStats(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, userType: activeTab, page: 1 }));
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      const { page, search, userType, limit, ...persistableFilters } = filters;
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(persistableFilters));
      if (limit) {
        localStorage.setItem(STORAGE_KEYS.TABLE_LIMIT, limit.toString());
      }
    } catch (err) {
      console.error('Failed to persist filters:', err);
    }
  }, [filters]);

  // Persist column visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(Array.from(visibleColumns)));
    } catch (err) {
      console.error('Failed to persist column visibility:', err);
    }
  }, [visibleColumns]);

  const handleTabChange = (tab: string) => {
    console.log('Tab clicked:', tab, 'Current activeTab:', activeTab);
    setActiveTab(tab as UserType);
    setSelectedUsers(new Set());
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      userType: activeTab,
    });
  };

  const handleStatClick = (filterType: 'all' | 'customers' | 'admins' | 'active' | 'inactive') => {
    switch (filterType) {
      case 'all':
        setFilters({
          page: 1,
          limit: filters.limit,
          userType: activeTab,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        break;
      case 'customers':
        setActiveTab('customer');
        searchParams.set('tab', 'customer');
        setSearchParams(searchParams);
        setFilters({
          page: 1,
          limit: filters.limit,
          userType: 'customer',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        break;
      case 'admins':
        setActiveTab('admin');
        searchParams.set('tab', 'admin');
        setSearchParams(searchParams);
        setFilters({
          page: 1,
          limit: filters.limit,
          userType: 'admin',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        break;
      case 'active':
        setFilters(prev => ({
          ...prev,
          disabled: false,
          page: 1,
        }));
        break;
      case 'inactive':
        setFilters(prev => ({
          ...prev,
          disabled: true,
          page: 1,
        }));
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u._id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleEditUser = (user: User) => {
    // TODO: Implement edit functionality
    toast({
      title: 'Edit User',
      description: 'Edit functionality will be implemented in the next phase',
    });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await usersApi.deleteUser(userToDelete._id);
      toast({
        title: t('users.messages.deleteSuccess'),
      });
      fetchUsers();
      fetchStats(); // Refresh stats after delete
    } catch (error) {
      toast({
        title: t('users.messages.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = (user: User) => {
    setUserToToggle(user);
    setShowToggleDialog(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    
    try {
      await usersApi.toggleUserStatus(userToToggle._id, !userToToggle.disabled);
      toast({
        title: userToToggle.disabled 
          ? t('users.messages.activateSuccess') 
          : t('users.messages.deactivateSuccess'),
      });
      fetchUsers();
      fetchStats(); // Refresh stats after toggle
    } catch (error) {
      toast({
        title: t('users.messages.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setShowToggleDialog(false);
      setUserToToggle(null);
    }
  };

  const handleToggleColumn = (column: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(new Set(['email', 'phone', 'role', 'status', 'country', 'joined']));
  };

  const handleSort = (column: string) => {
    // Map UI column names to API sortBy values (only valid UserFilters sortBy values)
    const columnMap: Record<string, 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' | 'userType'> = {
      name: 'firstName',
      email: 'email',
      role: 'userType',
      joined: 'createdAt',
    };

    // Only allow sorting for columns that map to valid API sortBy values
    const apiColumn = columnMap[column];
    if (!apiColumn) return;

    setFilters(prev => {
      // Toggle sort order if clicking the same column
      if (prev.sortBy === apiColumn) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
        };
      }
      // Set new column with default ascending order
      return {
        ...prev,
        sortBy: apiColumn,
        sortOrder: 'asc',
      };
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !['page', 'limit', 'sortBy', 'sortOrder', 'userType'].includes(key)
  ).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('users.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('users.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedUsers.size > 0 && (
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {t('users.actions.export')}
              </Button>
            )}
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('users.actions.create')}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="customer">
              {t('users.tabs.customers')}
            </TabsTrigger>
            <TabsTrigger value="admin">
              {t('users.tabs.admins')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <UsersStatsBar stats={userStats} onStatClick={handleStatClick} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 relative z-20">
          <div className="flex-1">
            <UsersFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <ColumnVisibilityToggle
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            onReset={handleResetColumns}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              console.log('Refresh button clicked');
              fetchUsers();
              fetchStats();
            }}
            className="shrink-0 cursor-pointer"
            title={t('users.actions.refresh')}
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <ActiveFiltersBadges
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          activeFilterCount={activeFilterCount}
        />

        {hasError ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-4">
              <UsersIcon className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Backend Connection Error
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Unable to connect to the API endpoint. Please check your backend configuration.
            </p>
            <p className="text-sm text-muted-foreground mb-4 font-mono">
              {errorMessage}
            </p>
            <Button onClick={() => { fetchUsers(); fetchStats(); }} className="gap-2">
              <RotateCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="glass-card rounded-2xl p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center mb-4">
              <UsersIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('users.empty.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('users.empty.description')}
            </p>
          </div>
        ) : (
          <>
            <UsersTable
              users={users}
              selectedUsers={selectedUsers}
              visibleColumns={visibleColumns}
              onSelectUser={handleSelectUser}
              onSelectAll={handleSelectAll}
              onView={() => {}}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSort={handleSort}
            />
            <UsersPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </motion.div>

      <DeleteUserDialog
        user={userToDelete}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
      />

      <DeactivateUserDialog
        user={userToToggle}
        open={showToggleDialog}
        onClose={() => setShowToggleDialog(false)}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
}
