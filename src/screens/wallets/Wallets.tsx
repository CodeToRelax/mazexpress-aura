import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Plus, Download, Trash2, RotateCw } from 'lucide-react';
import type { User, UserFilters } from '@/types/user';
import { usersApi } from '@/utilities/api/users.api';

// Wallet-centric view type
interface WalletView {
  walletId: string;
  walletIdDisplay: string;
  ownerName: string;
  ownerEmail: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  userId: string;
}
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { WalletsTable } from './WalletsTable';
import { WalletsFilters, ActiveFiltersBadges } from './WalletsFilters';
import { WalletsPagination } from './WalletsPagination';
import { WalletsColumnVisibilityToggle } from './WalletsColumnVisibilityToggle';
import { WalletsStatsBar } from './WalletsStatsBar';
import { DeleteWalletDialog } from './DeleteWalletDialog';
import { DeactivateWalletDialog } from './DeactivateWalletDialog';
import { CreateWalletDialog } from './CreateWalletDialog';
import { EditWalletDialog } from './EditWalletDialog';
import { ExportWalletsDialog } from './ExportWalletsDialog';

// localStorage keys
const STORAGE_KEYS = {
  VISIBLE_COLUMNS: 'wallets-visible-columns',
  FILTERS: 'wallets-filters',
  TABLE_LIMIT: 'wallets-table-limit',
};

export default function Wallets() {
  const { t } = useTranslation();
  
  const [wallets, setWallets] = useState<WalletView[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
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
  
  const [walletStats, setWalletStats] = useState({
    totalWallets: 0,
    activeWallets: 0,
    inactiveWallets: 0,
    totalBalance: 0,
    positiveBalanceCount: 0,
    negativeBalanceCount: 0,
    totalPositiveBalance: 0,
    totalNegativeBalance: 0,
  });

  // Initialize from localStorage
  const [filters, setFilters] = useState<UserFilters & { balanceFilter?: 'positive' | 'negative' | 'zero' }>(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      const savedLimit = localStorage.getItem(STORAGE_KEYS.TABLE_LIMIT);
      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      
      return {
        page: 1,
        limit: savedLimit ? parseInt(savedLimit) : 10,
        sortBy: parsedFilters.sortBy || 'createdAt',
        sortOrder: parsedFilters.sortOrder || 'desc',
        disabled: parsedFilters.disabled,
        createdAfter: parsedFilters.createdAfter,
        createdBefore: parsedFilters.createdBefore,
        balanceFilter: parsedFilters.balanceFilter,
      };
    } catch {
      return {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    }
  });

  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
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
    return new Set(['email', 'balance', 'currency', 'status', 'created']);
  });

  const fetchWallets = useCallback(async () => {
    console.log('fetchWallets called with filters:', filters);
    try {
      setLoading(true);
      setHasError(false);
      setErrorMessage('');
      
      // Fetch first page to get total count
      const firstPageResponse = await usersApi.getUsers({ 
        userType: 'customer', 
        limit: 100,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        disabled: filters.disabled,
        createdAfter: filters.createdAfter,
        createdBefore: filters.createdBefore,
        search: filters.search,
      });
      
      const totalPages = firstPageResponse.data.pagination.totalPages;
      
      // Fetch remaining pages if needed (max 10 pages = 1000 users)
      const pagePromises = [];
      for (let page = 2; page <= Math.min(totalPages, 10); page++) {
        pagePromises.push(usersApi.getUsers({ 
          userType: 'customer', 
          page, 
          limit: 100,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          disabled: filters.disabled,
          createdAfter: filters.createdAfter,
          createdBefore: filters.createdBefore,
          search: filters.search,
        }));
      }
      
      const allResponses = await Promise.all(pagePromises);
      const allUsers = [
        ...firstPageResponse.data.users,
        ...allResponses.flatMap(r => r.data.users)
      ];
      
      // Build a map of users by ID
      const userMap = new Map<string, User>();
      allUsers.forEach(user => userMap.set(user._id, user));
      setUsersMap(userMap);
      
      // Filter to only users with wallets and transform to wallet view
      const allWalletViews: WalletView[] = allUsers
        .filter(user => 
          user.walletId && 
          typeof user.walletId === 'object'
        )
        .map(user => {
          const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
          return {
            walletId: wallet._id,
            walletIdDisplay: '...' + wallet._id.slice(-6),
            ownerName: `${user.firstName} ${user.lastName}`,
            ownerEmail: user.email,
            balance: wallet.balance,
            currency: wallet.currency,
            isActive: wallet.isActive,
            createdAt: user.createdAt,
            userId: user._id,
          };
        });
      
      // Apply client-side balance filtering
      let filteredWallets = allWalletViews;
      if (filters.balanceFilter === 'positive') {
        filteredWallets = allWalletViews.filter(w => w.balance > 0);
      } else if (filters.balanceFilter === 'negative') {
        filteredWallets = allWalletViews.filter(w => w.balance < 0);
      } else if (filters.balanceFilter === 'zero') {
        filteredWallets = allWalletViews.filter(w => w.balance === 0);
      }

      // Apply client-side balance sorting before pagination
      if (filters.sortBy === 'balance') {
        filteredWallets = [...filteredWallets].sort((a, b) =>
          filters.sortOrder === 'asc' ? a.balance - b.balance : b.balance - a.balance
        );
      }
      
      // Apply client-side pagination based on actual wallet count
      const limit = filters.limit || 10;
      const page = filters.page || 1;
      const startIndex = (page - 1) * limit;
      const paginatedWallets = filteredWallets.slice(startIndex, startIndex + limit);
      
      setWallets(paginatedWallets);
      
      // Calculate accurate pagination based on filtered wallet count
      const totalFilteredWallets = filteredWallets.length;
      
      const calculatedTotalPages = Math.ceil(totalFilteredWallets / limit) || 1;
      
      setPagination({
        currentPage: page,
        totalPages: calculatedTotalPages,
        totalDocs: totalFilteredWallets,
        limit,
        hasNextPage: page < calculatedTotalPages,
        hasPrevPage: page > 1,
        nextPage: page < calculatedTotalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      });
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setHasError(true);
      setErrorMessage(message);
      
      // Only show toast if it's not a 404 (backend not ready)
      if (!message.includes('404')) {
        toast({
          title: t('wallets.messages.error'),
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
      // Fetch stats using smaller targeted requests
      const [customersResponse, activeUsersResponse, disabledUsersResponse] = await Promise.all([
        usersApi.getUsers({ userType: 'customer', limit: 1 }),
        usersApi.getUsers({ disabled: false, limit: 1 }),
        usersApi.getUsers({ disabled: true, limit: 1 }),
      ]);
      
      // Get total customers count from pagination
      const totalCustomers = customersResponse.data.pagination.totalDocs;
      
      // Now fetch all customer pages to calculate balance
      const totalPages = customersResponse.data.pagination.totalPages;
      const pagePromises = [];
      
      for (let page = 1; page <= Math.min(totalPages, 10); page++) {
        pagePromises.push(usersApi.getUsers({ userType: 'customer', page, limit: 100 }));
      }
      
      const allPagesResponses = await Promise.all(pagePromises);
      const allCustomers = allPagesResponses.flatMap(response => response.data.users);
      
      const usersWithWallets = allCustomers.filter(
        user => 
          user.walletId && 
          typeof user.walletId === 'object'
      );
      
      const activeWallets = usersWithWallets.filter(user => {
        const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
        return wallet.isActive;
      }).length;
      
      const totalBalance = usersWithWallets.reduce((sum, user) => {
        const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
        return sum + wallet.balance;
      }, 0);
      
      // Calculate positive and negative balance stats
      const positiveWallets = usersWithWallets.filter(user => {
        const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
        return wallet.balance > 0;
      });
      
      const negativeWallets = usersWithWallets.filter(user => {
        const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
        return wallet.balance < 0;
      });
      
      const totalPositiveBalance = positiveWallets.reduce((sum, user) => {
        const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
        return sum + wallet.balance;
      }, 0);
      
      const totalNegativeBalance = negativeWallets.reduce((sum, user) => {
        const wallet = user.walletId as { _id: string; balance: number; currency: string; isActive: boolean };
        return sum + wallet.balance;
      }, 0);
      
      setWalletStats({
        totalWallets: usersWithWallets.length,
        activeWallets,
        inactiveWallets: usersWithWallets.length - activeWallets,
        totalBalance,
        positiveBalanceCount: positiveWallets.length,
        negativeBalanceCount: negativeWallets.length,
        totalPositiveBalance,
        totalNegativeBalance,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      const { page, search, limit, ...persistableFilters } = filters;
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

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      balanceFilter: undefined,
    });
  };

  const handleStatClick = (filterType: 'all' | 'active' | 'inactive' | 'positive' | 'negative') => {
    switch (filterType) {
      case 'all':
        setFilters({
          page: 1,
          limit: filters.limit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          balanceFilter: undefined,
        });
        break;
      case 'active':
        setFilters(prev => ({
          ...prev,
          disabled: false,
          balanceFilter: undefined,
          page: 1,
        }));
        break;
      case 'inactive':
        setFilters(prev => ({
          ...prev,
          disabled: true,
          balanceFilter: undefined,
          page: 1,
        }));
        break;
      case 'positive':
        setFilters(prev => ({
          ...prev,
          disabled: undefined,
          balanceFilter: 'positive',
          page: 1,
        }));
        break;
      case 'negative':
        setFilters(prev => ({
          ...prev,
          disabled: undefined,
          balanceFilter: 'negative',
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

  const handleSelectWallet = (walletId: string) => {
    setSelectedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWallets(new Set(wallets.map(w => w.walletId)));
    } else {
      setSelectedWallets(new Set());
    }
  };

  const handleCreateWallet = () => {
    setShowCreateDialog(true);
  };

  const handleCreateSuccess = () => {
    fetchWallets();
    fetchStats();
  };

  const handleEditWallet = (wallet: WalletView) => {
    const user = usersMap.get(wallet.userId);
    if (user) {
      setUserToEdit(user);
      setShowEditDialog(true);
    }
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setUserToEdit(null);
    fetchWallets();
    fetchStats();
  };

  const handleDeleteWallet = (wallet: WalletView) => {
    const user = usersMap.get(wallet.userId);
    if (user) {
      setUserToDelete(user);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await usersApi.deleteUser(userToDelete._id);
      toast({
        title: t('wallets.messages.deleteSuccess'),
      });
      fetchWallets();
      fetchStats();
    } catch (error) {
      toast({
        title: t('wallets.messages.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = (wallet: WalletView) => {
    const user = usersMap.get(wallet.userId);
    if (user) {
      setUserToToggle(user);
      setShowToggleDialog(true);
    }
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    
    try {
      await usersApi.toggleUserStatus(userToToggle._id, !userToToggle.disabled);
      toast({
        title: userToToggle.disabled 
          ? t('wallets.messages.activateSuccess') 
          : t('wallets.messages.deactivateSuccess'),
      });
      fetchWallets();
      fetchStats();
    } catch (error) {
      toast({
        title: t('wallets.messages.error'),
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
    setVisibleColumns(new Set(['email', 'balance', 'currency', 'status', 'created']));
  };

  const handleSort = (column: string) => {
    const columnMap: Record<string, UserFilters['sortBy']> = {
      owner: 'firstName',
      email: 'email',
      created: 'createdAt',
      balance: 'balance',
    };

    const sortKey = columnMap[column];
    if (!sortKey) return;

    setFilters(prev => {
      if (prev.sortBy === sortKey) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' as const,
          page: 1,
        };
      }
      return {
        ...prev,
        sortBy: sortKey,
        sortOrder: 'asc' as const,
        page: 1,
      };
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
  ).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <WalletIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('wallets.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('wallets.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <WalletsStatsBar stats={walletStats} onStatClick={handleStatClick} />
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
            <WalletsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <WalletsColumnVisibilityToggle
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
              fetchWallets();
              fetchStats();
            }}
            className="shrink-0 cursor-pointer"
            title={t('wallets.actions.refresh')}
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
              <WalletIcon className="h-10 w-10 text-destructive" />
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
            <Button onClick={() => { fetchWallets(); fetchStats(); }} className="gap-2">
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
        ) : wallets.length === 0 && pagination.totalDocs === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center mb-4">
              <WalletIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('wallets.empty.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('wallets.empty.description')}
            </p>
          </div>
        ) : (
          <>
            {wallets.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center mb-4">
                  <WalletIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No wallets on this page
                </h2>
                <p className="text-muted-foreground">
                  Try navigating to a different page or adjusting your filters.
                </p>
              </div>
            ) : (
              <WalletsTable
                wallets={wallets}
                selectedWallets={selectedWallets}
                visibleColumns={visibleColumns}
                onSelectWallet={handleSelectWallet}
                onSelectAll={handleSelectAll}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            )}
            {pagination.totalDocs > 0 && (
              <WalletsPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            )}
          </>
        )}
      </motion.div>

      <DeleteWalletDialog
        user={userToDelete}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
      />

      <DeactivateWalletDialog
        user={userToToggle}
        open={showToggleDialog}
        onClose={() => setShowToggleDialog(false)}
        onConfirm={confirmToggleStatus}
      />

      <CreateWalletDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <EditWalletDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setUserToEdit(null);
        }}
        user={userToEdit}
        onSuccess={handleEditSuccess}
      />

      <ExportWalletsDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        filters={filters}
        totalCount={pagination.totalDocs}
      />
    </div>
  );
}
