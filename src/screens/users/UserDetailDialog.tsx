import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { X, Mail, Phone, MapPin, Calendar, User as UserIcon, Package, Wallet as WalletIcon, Shield, Receipt, Loader2, Plus } from 'lucide-react';
import type { User } from '@/types/user';
import type { Wallet } from '@/types/wallet';
import type { Transaction } from '@/types/wallet';
import type { Invoice } from '@/types/invoice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CreateTransactionDialog } from './CreateTransactionDialog';
import { EditTransactionDialog } from './EditTransactionDialog';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import { GenerateInvoiceDialog } from '@/screens/invoices/GenerateInvoiceDialog';
import { getUserInvoices } from '@/utilities/api/invoice.api';
import { getWalletByUserId, getUserTransactions } from '@/utilities/api/wallet.api';
import { toast } from '@/hooks/use-toast';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface UserDetailDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
}

export function UserDetailDialog({ user, open, onClose, onEdit }: UserDetailDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isDeleteTransactionOpen, setIsDeleteTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);
  
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
      setTransactions(transactionData.docs || []);
      setTransactionsPagination({
        totalDocs: transactionData.totalDocs,
        limit: transactionData.limit,
        totalPages: transactionData.totalPages,
        page: transactionData.page,
        hasPrevPage: transactionData.hasPrevPage,
        hasNextPage: transactionData.hasNextPage,
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const fetchInvoices = async () => {
    if (!user?._id) return;
    
    setIsLoadingInvoices(true);
    try {
      const response = await getUserInvoices(
        user._id,
        { 
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      );
      setInvoices(response.docs || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateValue: string | Date | null | undefined, formatString: string): string => {
    if (!dateValue) return 'N/A';
    
    const date = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    return format(date, formatString);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteTransactionOpen(true);
  };

  const handleTransactionSuccess = () => {
    fetchWalletData();
  };

  // Calculate transaction stats
  const transactionStats = {
    totalTransactions: transactionsPagination.totalDocs,
    totalDeposits: transactions.filter(t => t.type === 'deposit').length,
    depositAmount: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').length,
    withdrawalAmount: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
    pendingCount: transactions.filter(t => t.status === 'pending').length,
    completedCount: transactions.filter(t => t.status === 'completed').length,
    failedCount: transactions.filter(t => t.status === 'failed').length,
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

  // Refetch when filters change
  useEffect(() => {
    if (wallet) {
      fetchWalletData();
    }
  }, [transactionFilters, sortBy, sortOrder]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  {user.firstName} {user.lastName}
                </DialogTitle>
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
            <Button variant="outline" onClick={() => onEdit(user)}>
              {t('users.actions.edit')}
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className={`grid w-full ${user.userType === 'admin' ? 'grid-cols-4' : 'grid-cols-5'}`}>
            <TabsTrigger value="overview">{t('users.detail.overview')}</TabsTrigger>
            <TabsTrigger value="profile">{t('users.detail.profile')}</TabsTrigger>
            {user.userType !== 'admin' && (
              <>
                <TabsTrigger value="wallet" onClick={fetchWalletData}>
                  <WalletIcon className="h-4 w-4 mr-2" />
                  Wallet
                </TabsTrigger>
                <TabsTrigger value="invoices" onClick={fetchInvoices}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Invoices
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {user.userType === 'admin' && (
              <TabsTrigger value="acl">
                <Shield className="h-4 w-4 mr-2" />
                {t('acl:permissions')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-3">
              <h3 className="font-semibold text-lg">{t('users.detail.generalInfo')}</h3>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
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
                      <div className="font-medium font-mono text-sm">{user.walletId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-3">
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

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
          <TabsContent value="wallet" className="space-y-4 mt-4">
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
                
                <div className="glass-card p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <h3 className="font-semibold">Transactions</h3>
                    <div className="flex gap-2 flex-wrap">
                      <TransactionsColumnVisibilityToggle
                        visibleColumns={visibleColumns}
                        onToggleColumn={handleToggleColumn}
                        onReset={handleResetColumns}
                      />
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => setIsCreateTransactionOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
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
                    onDelete={handleDeleteTransaction}
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
                  <p className="font-medium mb-2">No Wallet</p>
                  <p className="text-sm text-muted-foreground">This user does not have a wallet yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          )}

          {user.userType !== 'admin' && (
          <TabsContent value="invoices" className="space-y-4 mt-4">
            {isLoadingInvoices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="glass-card p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Invoices</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setIsGenerateInvoiceOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('invoice.actions.generate')}
                    </Button>
                    <Button variant="link" size="sm" onClick={() => { onClose(); navigate(`/invoices?userId=${user._id}`); }}>
                      View All
                    </Button>
                  </div>
                </div>
                <Separator />
                
                {invoices.length > 0 ? (
                  <div className="space-y-2">
                    {invoices.map((invoice) => {
                      const getStatusColor = (status: string) => {
                        const colors = {
                          PAID: 'bg-green-500/10 text-green-700 dark:text-green-400',
                          UNPAID: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
                          OVERDUE: 'bg-red-500/10 text-red-700 dark:text-red-400',
                          PARTIALLY_PAID: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
                          DRAFT: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
                          CANCELLED: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
                        };
                        return colors[status as keyof typeof colors] || colors.DRAFT;
                      };

                      return (
                        <Card 
                          key={invoice._id}
                          className="cursor-pointer transition-colors hover:bg-accent/50"
                          onClick={() => { onClose(); navigate(`/invoices/${invoice._id}`); }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                                  <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                                    {invoice.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatLYD(invoice.totals.gross)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Due: {formatLYD(invoice.totals.due)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No invoices found
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          )}

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="glass-card p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

          {/* ACL Management Tab - Only for Admins */}
          {user.userType === 'admin' && (
            <TabsContent value="acl" className="mt-4">
              <ACLManagementTab userId={user._id} userType={user.userType} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>

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

      <DeleteTransactionDialog
        open={isDeleteTransactionOpen}
        onClose={() => {
          setIsDeleteTransactionOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSuccess={() => {
          handleTransactionSuccess();
          setIsDeleteTransactionOpen(false);
          setSelectedTransaction(null);
        }}
      />

      <GenerateInvoiceDialog
        open={isGenerateInvoiceOpen}
        onOpenChange={setIsGenerateInvoiceOpen}
        userId={user._id}
        onSuccess={() => {
          fetchInvoices();
          setIsGenerateInvoiceOpen(false);
        }}
      />
    </Dialog>
  );
}
