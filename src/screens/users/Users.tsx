import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Plus, Download, Trash2, RotateCw } from 'lucide-react';
import type { User, UserFilters, UserType } from '@/types/user';
import { usersApi } from '@/utilities/api/users.api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTable } from './UsersTable';
import { UsersFilters } from './UsersFilters';
import { UsersPagination } from './UsersPagination';
import { UserDetailDialog } from './UserDetailDialog';

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
  
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    userType: activeTab,
  });

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchUsers = useCallback(async () => {
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, userType: activeTab, page: 1 }));
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tab: string) => {
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

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailDialog(true);
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

  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.toggleUserStatus(user._id, !user.disabled);
      toast({
        title: user.disabled 
          ? t('users.messages.activateSuccess') 
          : t('users.messages.deactivateSuccess'),
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: t('users.messages.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
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
              <>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('users.actions.export')}
                </Button>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t('users.bulk.delete')} ({selectedUsers.size})
                </Button>
              </>
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <UsersFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            className="shrink-0"
            title={t('users.actions.refresh')}
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

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
            <Button onClick={fetchUsers} className="gap-2">
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
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('users.empty.description')}
            </p>
          </div>
        ) : (
          <>
            <UsersTable
              users={users}
              selectedUsers={selectedUsers}
              onSelectUser={handleSelectUser}
              onSelectAll={handleSelectAll}
              onView={handleViewUser}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
            />

            <UsersPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </motion.div>

      <UserDetailDialog
        user={selectedUser}
        open={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedUser(null);
        }}
        onEdit={handleEditUser}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.actions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.messages.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('users.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('users.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
