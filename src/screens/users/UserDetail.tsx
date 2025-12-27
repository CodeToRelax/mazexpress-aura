import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User as UserIcon, Package, Wallet as WalletIcon, Shield, Loader2, TrendingUp, Plus, Download } from 'lucide-react';
import type { User } from '@/types/user';
import type { Wallet } from '@/types/wallet';
import type { Transaction } from '@/types/wallet';
import type { IShipment, ShipmentFilters as ShipmentFiltersType } from '@/types/shipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ACLManagementTab } from './ACLManagementTab';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { TransactionsTable } from '@/components/wallet/TransactionsTable';
import { TransactionsStatsBar } from '@/screens/wallet/TransactionsStatsBar';
import { TransactionsFilters } from '@/screens/wallet/TransactionsFilters';
import { TransactionsPagination } from '@/screens/wallet/TransactionsPagination';
import { TransactionsColumnVisibilityToggle } from '@/screens/wallet/TransactionsColumnVisibilityToggle';
import { ShipmentsTable } from '@/screens/shipments/ShipmentsTable';
import { ShipmentsFilters } from '@/screens/shipments/ShipmentsFilters';
import { ShipmentsPagination } from '@/screens/shipments/ShipmentsPagination';
import { ColumnVisibilityToggle as ShipmentsColumnVisibilityToggle } from '@/screens/shipments/ColumnVisibilityToggle';
import { CreateTransactionDialog } from './CreateTransactionDialog';
import { CreateUserWalletDialog } from './CreateUserWalletDialog';
import { EditTransactionDialog } from './EditTransactionDialog';
import { RefundTransactionDialog } from './RefundTransactionDialog';
import { EditUserDialog } from './EditUserDialog';
import { usersApi } from '@/utilities/api/users.api';
import { getWalletByUserId, getUserTransactions } from '@/utilities/api/wallet.api';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { exportUserTransactionsToCSV } from '@/utilities/helpers/transactionExport';
import { toast } from '@/hooks/use-toast';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsPagination, setTransactionsPagination] = useState<{
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
  }>({
    totalDocs: 0,
    limit: 10,
    totalPages: 0,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isRefundTransactionOpen, setIsRefundTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  
  // Transaction filters and settings
  const [transactionFilters, setTransactionFilters] = useState<any>({
    page: 1,
    limit: 10,
  });
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['transactionNumber', 'type', 'description', 'date', 'amount', 'status'])
  );
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Shipments state
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [shipmentsPagination, setShipmentsPagination] = useState({
    totalDocs: 0,
    limit: 10,
    totalPages: 0,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);
  const [shipmentFilters, setShipmentFilters] = useState<ShipmentFiltersType>({ page: 1, limit: 10 });
  const [shipmentVisibleColumns, setShipmentVisibleColumns] = useState<Set<string>>(
    new Set(['origin', 'destination', 'method', 'status', 'weight', 'createdAt'])
  );
  const [selectedShipments, setSelectedShipments] = useState<Set<string>>(new Set());
  const [shipmentSortBy, setShipmentSortBy] = useState<string>('createdAt');
  const [shipmentSortOrder, setShipmentSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      try {
        const response = await usersApi.getUserById(id);
        setUser(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load user details',
          variant: 'destructive',
        });
        navigate('/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  // Auto-fetch wallet data when tab query parameter is 'wallet'
  useEffect(() => {
    if (defaultTab === 'wallet' && user && !wallet) {
      fetchWalletData();
    }
  }, [defaultTab, user]);

  // Auto-fetch shipments data when tab query parameter is 'shipments'
  useEffect(() => {
    if (defaultTab === 'shipments' && user && shipments.length === 0) {
      fetchShipmentsData();
    }
  }, [defaultTab, user]);

  const fetchShipmentsData = async () => {
    if (!user?.uniqueShippingNumber) return;
    
    setIsLoadingShipments(true);
    try {
      const response = await shipmentsApi.getShipments({
        ...shipmentFilters,
        csn: user.uniqueShippingNumber,
        sort: `${shipmentSortBy}:${shipmentSortOrder}`,
      });
      
      setShipments(response.data.shipments || []);
      setShipmentsPagination({
        totalDocs: response.data.pagination?.totalDocs ?? 0,
        limit: response.data.pagination?.limit ?? 10,
        totalPages: response.data.pagination?.totalPages ?? 0,
        page: response.data.pagination?.currentPage ?? 1,
        hasPrevPage: response.data.pagination?.hasPrevPage ?? false,
        hasNextPage: response.data.pagination?.hasNextPage ?? false,
      });
    } catch (error) {
      console.error('[UserDetail] Error fetching shipments data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shipments data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const fetchWalletData = async () => {
    if (!user?._id) return;
    
    setIsLoadingWallet(true);
    try {
      const walletData = await getWalletByUserId(user._id);
      setWallet(walletData);
      
      const transactionData = await getUserTransactions(user._id, {
        ...transactionFilters,
        sortBy,
        sortOrder,
      });
      
      setTransactions(transactionData.transactions || []);
      setTransactionsPagination({
        totalDocs: transactionData.pagination?.totalItems ?? 0,
        limit: transactionData.pagination?.itemsPerPage ?? 10,
        totalPages: transactionData.pagination?.totalPages ?? 0,
        page: transactionData.pagination?.currentPage ?? 1,
        hasPrevPage: transactionData.pagination?.hasPrevPage ?? false,
        hasNextPage: transactionData.pagination?.hasNextPage ?? false,
      });
    } catch (error: any) {
      // Silently handle 404 errors (wallet not found) - this is expected for users without wallets
      const isNotFound = error?.message?.includes('404') || 
                         error?.message?.toLowerCase().includes('not found') ||
                         error?.status === 404;
      
      if (!isNotFound) {
        console.error('[UserDetail] Error fetching wallet data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load wallet data',
          variant: 'destructive',
        });
      }
      // For 404 errors, wallet remains null and the "No Wallet" state will be shown
    } finally {
      setIsLoadingWallet(false);
    }
  };


  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateValue: string | Date | null | undefined, formatString: string): string => {
    if (!dateValue) return 'N/A';
    
    const date = new Date(dateValue);
    
    if (isNaN(date.getTime())) return 'N/A';
    
    return format(date, 'dd/MM/yyyy');
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const handleRefundTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsRefundTransactionOpen(true);
  };

  const handleTransactionSuccess = () => {
    console.log('[UserDetail] Transaction success, refetching wallet data');
    fetchWalletData();
  };

  // Calculate transaction stats
  const transactionStats = {
    totalTransactions: transactionsPagination.totalDocs,
    totalDeposits: transactions.filter(t => t.type === 'deposit').length,
    depositAmount: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').length,
    withdrawalAmount: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
    totalRefunds: transactions.filter(t => t.type === 'refund').length,
    refundAmount: transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0),
    totalDeductions: transactions.filter(t => t.type === 'deduction').length,
    deductionAmount: transactions.filter(t => t.type === 'deduction').reduce((sum, t) => sum + t.amount, 0),
    completedCount: transactions.filter(t => t.status === 'completed').length,
  };

  const handleFiltersChange = (newFilters: any) => {
    setTransactionFilters({ ...newFilters, page: 1 });
  };

  const handleClearFilters = () => {
    setTransactionFilters({ page: 1, limit: transactionFilters.limit });
  };

  const handlePageChange = (page: number) => {
    setTransactionFilters({ ...transactionFilters, page });
  };

  const handleLimitChange = (limit: number) => {
    setTransactionFilters({ ...transactionFilters, limit, page: 1 });
  };

  const handleToggleColumn = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey);
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const handleResetColumns = () => {
    setVisibleColumns(new Set(['transactionNumber', 'type', 'description', 'date', 'amount', 'status']));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleStatClick = (filterType: string) => {
    if (filterType === 'all') {
      handleClearFilters();
    } else if (filterType === 'deposits') {
      setTransactionFilters({ ...transactionFilters, type: 'deposit', page: 1 });
    } else if (filterType === 'withdrawals') {
      setTransactionFilters({ ...transactionFilters, type: 'withdrawal', page: 1 });
    } else if (filterType === 'pending' || filterType === 'completed' || filterType === 'failed') {
      setTransactionFilters({ ...transactionFilters, status: filterType, page: 1 });
    }
  };

  const handleExportCSV = async () => {
    if (!user?._id) return;
    
    try {
      toast({
        title: t('wallet.messages.exportingCSV'),
      });
      await exportUserTransactionsToCSV(user._id, transactionFilters, i18n.language);
      toast({
        title: t('wallet.messages.exportSuccess'),
      });
    } catch (error) {
      toast({
        title: t('wallet.messages.exportError'),
        description: error instanceof Error ? error.message : 'Failed to export',
        variant: 'destructive',
      });
    }
  };

  // Refetch when filters change
  useEffect(() => {
    if (wallet) {
      fetchWalletData();
    }
  }, [transactionFilters, sortBy, sortOrder]);

  // Refetch shipments when filters change
  useEffect(() => {
    if (user?.uniqueShippingNumber && shipments.length > 0) {
      fetchShipmentsData();
    }
  }, [shipmentFilters, shipmentSortBy, shipmentSortOrder]);

  // Shipment handlers
  const handleShipmentFiltersChange = (newFilters: ShipmentFiltersType) => {
    setShipmentFilters({ ...newFilters, page: 1 });
  };

  const handleClearShipmentFilters = () => {
    setShipmentFilters({ page: 1, limit: shipmentFilters.limit });
  };

  const handleShipmentPageChange = (page: number) => {
    setShipmentFilters({ ...shipmentFilters, page });
  };

  const handleShipmentLimitChange = (limit: number) => {
    setShipmentFilters({ ...shipmentFilters, limit, page: 1 });
  };

  const handleShipmentSort = (column: string) => {
    if (shipmentSortBy === column) {
      setShipmentSortOrder(shipmentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setShipmentSortBy(column);
      setShipmentSortOrder('desc');
    }
  };

  const handleToggleShipmentColumn = (columnKey: string) => {
    const newVisibleColumns = new Set(shipmentVisibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey);
    } else {
      newVisibleColumns.add(columnKey);
    }
    setShipmentVisibleColumns(newVisibleColumns);
  };

  const handleResetShipmentColumns = () => {
    setShipmentVisibleColumns(new Set(['origin', 'destination', 'method', 'status', 'weight', 'createdAt']));
  };

  const handleSelectShipment = (shipmentId: string) => {
    const newSelected = new Set(selectedShipments);
    if (newSelected.has(shipmentId)) {
      newSelected.delete(shipmentId);
    } else {
      newSelected.add(shipmentId);
    }
    setSelectedShipments(newSelected);
  };

  const handleSelectAllShipments = (selected: boolean) => {
    if (selected) {
      setSelectedShipments(new Set(shipments.map(s => s._id)));
    } else {
      setSelectedShipments(new Set());
    }
  };

  const getShipmentActiveFiltersCount = () => {
    return Object.keys(shipmentFilters).filter(
      key => key !== 'page' && key !== 'limit' && key !== 'csn' && shipmentFilters[key as keyof ShipmentFiltersType]
    ).length;
  };

  const handleEditUserSuccess = async () => {
    setIsEditUserOpen(false);
    if (!id) return;
    try {
      const response = await usersApi.getUserById(id);
      setUser(response.data);
      toast({
        title: t('users.messages.updateSuccess'),
        description: 'User information updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reload user details',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/users')}
            className="glass-card hover:shadow-glass-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.userType === 'admin' ? 'default' : 'secondary'}>
                {t(`users.table.role.${user.userType}`)}
              </Badge>
              <Badge variant={user.disabled ? 'destructive' : 'default'}>
                {t(`users.table.status.${user.disabled ? 'disabled' : 'active'}`)}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditUserOpen(true)}>
          {t('users.actions.edit')}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full ${user.userType === 'admin' ? 'grid-cols-5' : 'grid-cols-5'}`}>
          <TabsTrigger value="overview">{t('users.detail.overview')}</TabsTrigger>
          <TabsTrigger value="profile">{t('users.detail.profile')}</TabsTrigger>
          <TabsTrigger value="shipments" onClick={fetchShipmentsData}>
            <Package className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('users.detail.shipments', { defaultValue: 'Shipments' })}
          </TabsTrigger>
          {user.userType !== 'admin' && (
            <TabsTrigger value="wallet" onClick={fetchWalletData}>
              <WalletIcon className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              Wallet
            </TabsTrigger>
          )}
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          {user.userType === 'admin' && (
            <TabsTrigger value="acl">
              <Shield className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('acl:permissions')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-semibold text-lg">{t('users.detail.generalInfo')}</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.detail.fields.email')}</div>
                  <div className="font-medium">{user.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.detail.fields.phone')}</div>
                  <div className="font-medium">{user.phoneNumber}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.detail.fields.gender')}</div>
                  <div className="font-medium capitalize">{user.gender}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.detail.fields.birthdate')}</div>
                  <div className="font-medium">
                    {formatDate(user.birthdate, 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('users.detail.fields.shippingNumber')}</div>
                  <div className="font-medium font-mono">{user.uniqueShippingNumber}</div>
                </div>
              </div>

              {user.walletId && (
                <div className="flex items-start gap-3">
                  <WalletIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">{t('users.detail.fields.walletId')}</div>
                    <div className="font-medium font-mono text-sm">
                      {typeof user.walletId === 'string' ? user.walletId : user.walletId._id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-semibold text-lg">{t('users.detail.addressInfo')}</h3>
            <Separator />
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                {user.address.street && (
                  <div>{user.address.street}</div>
                )}
                {user.address.specificDescription && (
                  <div className="text-muted-foreground">{user.address.specificDescription}</div>
                )}
                <div className="font-medium capitalize">
                  {user.address.city}, {user.address.country}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.firstName')}</label>
                <div className="font-medium mt-1">{user.firstName}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.lastName')}</label>
                <div className="font-medium mt-1">{user.lastName}</div>
              </div>
              {user.username && (
                <div>
                  <label className="text-sm text-muted-foreground">{t('users.detail.fields.username')}</label>
                  <div className="font-medium mt-1">@{user.username}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.userType')}</label>
                <div className="font-medium mt-1 capitalize">{user.userType}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.accountStatus')}</label>
                <div className="mt-1">
                  <Badge variant={user.disabled ? 'destructive' : 'default'}>
                    {user.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4 mt-6">
          {isLoadingShipments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h3 className="font-semibold text-lg">
                  {t('users.detail.shipments', { defaultValue: 'Shipments' })} ({shipmentsPagination.totalDocs})
                </h3>
                <ShipmentsColumnVisibilityToggle
                  visibleColumns={shipmentVisibleColumns}
                  onToggleColumn={handleToggleShipmentColumn}
                  onReset={handleResetShipmentColumns}
                />
              </div>
              
              <ShipmentsFilters
                filters={shipmentFilters}
                onFiltersChange={handleShipmentFiltersChange}
                onClearFilters={handleClearShipmentFilters}
                activeFilterCount={getShipmentActiveFiltersCount()}
              />
              
              <ShipmentsTable
                shipments={shipments}
                selectedShipments={selectedShipments}
                onSelectShipment={handleSelectShipment}
                onSelectAll={handleSelectAllShipments}
                onEdit={() => {}}
                onDelete={() => {}}
                visibleColumns={shipmentVisibleColumns}
                sortBy={shipmentSortBy}
                sortOrder={shipmentSortOrder}
                onSort={handleShipmentSort}
              />

              <ShipmentsPagination
                currentPage={shipmentsPagination.page}
                totalPages={shipmentsPagination.totalPages}
                totalItems={shipmentsPagination.totalDocs}
                itemsPerPage={shipmentsPagination.limit}
                hasPrevPage={shipmentsPagination.hasPrevPage}
                hasNextPage={shipmentsPagination.hasNextPage}
                onPageChange={handleShipmentPageChange}
                onLimitChange={handleShipmentLimitChange}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4 mt-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.firebaseId')}</label>
                <div className="font-mono text-sm mt-1 break-all">{user.firebaseId}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">User ID</label>
                <div className="font-mono text-sm mt-1 break-all">{user._id}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.createdAt')}</label>
                <div className="font-medium mt-1">
                  {formatDate(user.createdAt, 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.updatedAt')}</label>
                <div className="font-medium mt-1">
                  {formatDate(user.updatedAt, 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('users.detail.fields.privacyAgreement')}</label>
                <div className="mt-1">
                  <Badge variant={user.privacyPolicy.usageAgreement ? 'default' : 'destructive'}>
                    {user.privacyPolicy.usageAgreement ? 'Agreed' : 'Not Agreed'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {user.userType !== 'admin' && (
          <TabsContent value="wallet" className="space-y-4 mt-6">
            {isLoadingWallet ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : wallet ? (
            <>
              <WalletBalance balance={wallet.balance} currency={wallet.currency} />
              
              <TransactionsStatsBar 
                stats={transactionStats}
                onStatClick={handleStatClick}
              />

              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <h3 className="font-semibold text-lg">Transactions</h3>
                  <div className="flex gap-2 flex-wrap">
                    <TransactionsColumnVisibilityToggle
                      visibleColumns={visibleColumns}
                      onToggleColumn={handleToggleColumn}
                      onReset={handleResetColumns}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExportCSV}
                      title={t('wallet.actions.exportCSV')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setIsCreateTransactionOpen(true)}
                      disabled={isLoadingWallet || !wallet}
                    >
                      {isLoadingWallet ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Transaction
                    </Button>
                  </div>
                </div>
                
                <TransactionsFilters
                  filters={transactionFilters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  activeFilterCount={Object.keys(transactionFilters).filter(
                    key => key !== 'page' && key !== 'limit' && transactionFilters[key]
                  ).length}
                />
                
                <TransactionsTable
                  transactions={transactions}
                  onEdit={handleEditTransaction}
                  onRefund={handleRefundTransaction}
                  isAdmin={true}
                  visibleColumns={visibleColumns}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />

                <TransactionsPagination
                  currentPage={transactionsPagination.page}
                  totalPages={transactionsPagination.totalPages}
                  totalDocs={transactionsPagination.totalDocs}
                  limit={transactionsPagination.limit}
                  hasPrevPage={transactionsPagination.hasPrevPage}
                  hasNextPage={transactionsPagination.hasNextPage}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Wallet</p>
                <p className="text-sm text-muted-foreground mb-4">This user does not have a wallet yet</p>
                <Button onClick={() => setIsCreateWalletOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        )}

        {user.userType === 'admin' && (
          <TabsContent value="acl" className="mt-6">
            <ACLManagementTab userId={user._id} userType={user.userType} />
          </TabsContent>
        )}
      </Tabs>

      <CreateTransactionDialog
        open={isCreateTransactionOpen}
        onClose={() => setIsCreateTransactionOpen(false)}
        walletId={wallet?._id}
        onSuccess={() => {
          handleTransactionSuccess();
          setIsCreateTransactionOpen(false);
        }}
      />

      <EditTransactionDialog
        open={isEditTransactionOpen}
        onClose={() => {
          setIsEditTransactionOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSuccess={() => {
          handleTransactionSuccess();
          setIsEditTransactionOpen(false);
          setSelectedTransaction(null);
        }}
      />

      <RefundTransactionDialog
        open={isRefundTransactionOpen}
        onClose={() => {
          setIsRefundTransactionOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSuccess={() => {
          handleTransactionSuccess();
          setIsRefundTransactionOpen(false);
          setSelectedTransaction(null);
        }}
      />

      <EditUserDialog
        open={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        user={user}
        onSuccess={handleEditUserSuccess}
      />

      <CreateUserWalletDialog
        open={isCreateWalletOpen}
        onOpenChange={setIsCreateWalletOpen}
        userId={user._id}
        userName={`${user.firstName} ${user.lastName}`}
        onSuccess={fetchWalletData}
      />
    </div>
  );
}
