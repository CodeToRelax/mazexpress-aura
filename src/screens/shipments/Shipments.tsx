import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Plus, RotateCw, Plane, Ship, Truck, Printer, Barcode } from 'lucide-react';
import type { IShipment, ShipmentFilters } from '@/types/shipment';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { InlineError } from '@/components/feedback/InlineError';
import { ShipmentsTable } from './ShipmentsTable';
import { ShipmentsFilters } from './ShipmentsFilters';
import { ShipmentsPagination } from './ShipmentsPagination';
import { ShipmentsStatsBar } from './ShipmentsStatsBar';
import { ColumnVisibilityToggle } from './ColumnVisibilityToggle';
import { CreateShipmentDialog } from './CreateShipmentDialog';
import { EditShipmentDialog } from './EditShipmentDialog';
import { DeleteShipmentDialog } from './DeleteShipmentDialog';
import { BulkUpdateDialog } from './BulkUpdateDialog';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { BarcodeScanDialog } from './BarcodeScanDialog';
import { generateBulkShipmentLabels } from '@/utilities/helpers/shipmentLabel';

// localStorage keys
const STORAGE_KEYS = {
  FILTERS: 'shipments-filters',
  TABLE_LIMIT: 'shipments-table-limit',
};

export default function Shipments() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
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
  
  const [shipmentStats, setShipmentStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    overdue: 0,
    receivedAtWarehouse: 0,
    shippedToDestination: 0,
    readyForPickUp: 0,
    cancelled: 0,
    returned: 0,
  });

  // Initialize filters from localStorage
  const [filters, setFilters] = useState<ShipmentFilters>(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      const savedLimit = localStorage.getItem(STORAGE_KEYS.TABLE_LIMIT);
      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      
      return {
        page: 1,
        limit: savedLimit ? parseInt(savedLimit) : 10,
        sort: parsedFilters.sort || '-createdAt',
        ...parsedFilters,
      };
    } catch {
      return {
        page: 1,
        limit: 10,
        sort: '-createdAt',
      };
    }
  });

  const [selectedShipments, setSelectedShipments] = useState<Set<string>>(new Set());
  const [shipmentToEdit, setShipmentToEdit] = useState<IShipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<IShipment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBarcodeScanDialog, setShowBarcodeScanDialog] = useState(false);
  
  // Shipping method tab state
  const [activeMethodTab, setActiveMethodTab] = useState<string>('all');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('shipments-visible-columns');
      return saved ? new Set(JSON.parse(saved)) : new Set(['isn', 'destination', 'method', 'status', 'weight', 'extraCosts', 'estimatedArrival']);
    } catch {
      return new Set(['isn', 'destination', 'method', 'status', 'weight', 'extraCosts', 'estimatedArrival']);
    }
  });

  // Persist column visibility
  useEffect(() => {
    localStorage.setItem('shipments-visible-columns', JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  const handleToggleColumn = (column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(new Set(['isn', 'destination', 'method', 'status', 'weight', 'extraCosts', 'estimatedArrival']));
  };

  const fetchShipments = useCallback(async () => {
    try {
      setIsFetching(true);
      setHasError(false);
      setErrorMessage('');
      const response = await shipmentsApi.getShipments(filters);
      setShipments(response.data.shipments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setHasError(true);
      setErrorMessage(message);
      
      if (!message.includes('404')) {
        toast({
          title: t('shipments.messages.error'),
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [filters, t]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await shipmentsApi.getStats();
      // Map backend response to frontend format
      setShipmentStats({
        total: response.total || 0,
        pending: response.pending || 0,
        inTransit: response.inTransit || 0,
        delivered: response.delivered || 0,
        overdue: response.overdue || 0,
        receivedAtWarehouse: response.receivedAtWarehouse || 0,
        shippedToDestination: response.shippedToDestination || 0,
        readyForPickUp: response.readyForPickUp || 0,
        cancelled: response.cancelled || 0,
        returned: response.returned || 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Sync filters.page with pagination.currentPage
  useEffect(() => {
    if (pagination.currentPage !== filters.page) {
      setFilters(prev => ({ ...prev, page: pagination.currentPage }));
    }
  }, [pagination.currentPage]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      const { page, ...persistableFilters } = filters;
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(persistableFilters));
      if (filters.limit) {
        localStorage.setItem(STORAGE_KEYS.TABLE_LIMIT, filters.limit.toString());
      }
    } catch (err) {
      console.error('Failed to persist filters:', err);
    }
  }, [filters]);

  const handleFiltersChange = (newFilters: ShipmentFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sort: '-createdAt',
    });
  };

  const handleStatClick = (filterType: 'all' | 'pending' | 'in transit' | 'delivered' | 'received at warehouse' | 'shipped to destination' | 'ready for pick up' | 'cancelled' | 'returned') => {
    switch (filterType) {
      case 'all':
        setFilters({
          page: 1,
          limit: filters.limit,
          sort: '-createdAt',
        });
        break;
      case 'pending':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'pending',
          sort: '-createdAt',
        });
        break;
      case 'in transit':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'in transit',
          sort: '-createdAt',
        });
        break;
      case 'delivered':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'delivered',
          sort: '-createdAt',
        });
        break;
      case 'received at warehouse':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'received at warehouse',
          sort: '-createdAt',
        });
        break;
      case 'shipped to destination':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'shipped to destination',
          sort: '-createdAt',
        });
        break;
      case 'ready for pick up':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'ready for pick up',
          sort: '-createdAt',
        });
        break;
      case 'cancelled':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'cancelled',
          sort: '-createdAt',
        });
        break;
      case 'returned':
        setFilters({
          page: 1,
          limit: filters.limit,
          status: 'returned',
          sort: '-createdAt',
        });
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId);
      } else {
        newSet.add(shipmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(new Set(shipments.map(s => s._id)));
    } else {
      setSelectedShipments(new Set());
    }
  };

  const handleCreateShipment = () => {
    setShowCreateDialog(true);
  };

  const handleCreateSuccess = () => {
    fetchShipments();
    fetchStats();
  };

  const handleEditShipment = (shipment: IShipment) => {
    setShipmentToEdit(shipment);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    fetchShipments();
    fetchStats();
  };

  const handleDeleteShipment = (shipment: IShipment) => {
    setShipmentToDelete(shipment);
    setShowDeleteDialog(true);
  };

  const handleDeleteSuccess = () => {
    fetchShipments();
    fetchStats();
    setSelectedShipments(new Set());
  };

  const handleBulkUpdate = () => {
    setShowBulkUpdateDialog(true);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleBulkSuccess = () => {
    fetchShipments();
    fetchStats();
    setSelectedShipments(new Set());
  };

  const handleBulkPrintLabels = () => {
    const selectedShipmentsList = shipments.filter(s => selectedShipments.has(s._id));
    generateBulkShipmentLabels(selectedShipmentsList);
  };

  const handleSort = (column: string) => {
    const currentSort = filters.sort || '-createdAt';
    const currentColumn = currentSort.startsWith('-') ? currentSort.substring(1) : currentSort;
    const currentOrder = currentSort.startsWith('-') ? 'desc' : 'asc';

    // Toggle order if same column, otherwise default to ascending
    let newSort: string;
    if (currentColumn === column) {
      newSort = currentOrder === 'asc' ? `-${column}` : column;
    } else {
      newSort = column;
    }

    setFilters(prev => ({ ...prev, sort: newSort, page: 1 }));
  };

  // Parse current sort state
  const currentSort = filters.sort || '-createdAt';
  const sortBy = currentSort.startsWith('-') ? currentSort.substring(1) : currentSort;
  const sortOrder = currentSort.startsWith('-') ? 'desc' : 'asc';

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !['page', 'limit', 'sort'].includes(key)
  ).length;

  // Handle shipping method tab changes
  const handleMethodTabChange = (value: string) => {
    setActiveMethodTab(value);
    if (value === 'all') {
      // Remove method filter
      const { method, shippingMethod, ...restFilters } = filters;
      setFilters({ ...restFilters, page: 1 });
    } else {
      // Set method filter
      setFilters({ ...filters, method: value, page: 1 });
    }
  };

  // Sync active tab with filters
  useEffect(() => {
    const currentMethod = filters.method || filters.shippingMethod;
    if (!currentMethod) {
      setActiveMethodTab('all');
    } else if (['air', 'sea', 'land'].includes(currentMethod.toLowerCase())) {
      setActiveMethodTab(currentMethod.toLowerCase());
    }
  }, [filters.method, filters.shippingMethod]);

  const showLoadingSkeleton = isLoading || isFetching;

  return (
    <ACLGuard flag="canViewShipments" fallback={<div>{t('common.noPermission')}</div>}>
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
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('shipments.title')}
                </h1>
                <p className="text-muted-foreground">
                  {t('shipments.subtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedShipments.size > 0 && (
                <ACLGuard flag="canBulkUpdateShipments">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBulkPrintLabels}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Labels ({selectedShipments.size})
                    </Button>
                    <Button variant="outline" onClick={handleBulkUpdate}>
                      {t('shipments.actions.bulkUpdate')}
                    </Button>
                    <Button variant="destructive" onClick={handleBulkDelete}>
                      {t('shipments.actions.bulkDelete')}
                    </Button>
                  </div>
                </ACLGuard>
              )}
              <ACLGuard flag="canBulkUpdateShipments">
                <Button variant="outline" onClick={() => setShowBarcodeScanDialog(true)}>
                  <Barcode className="h-4 w-4 mr-2" />
                  {t('shipments.actions.scanBarcodes')}
                </Button>
              </ACLGuard>
              <ACLGuard flag="canCreateShipments">
                <Button className="gap-2" onClick={handleCreateShipment}>
                  <Plus className="h-4 w-4" />
                  {t('shipments.actions.create')}
                </Button>
              </ACLGuard>
            </div>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <ACLGuard flag="canViewShipmentStats">
              <ShipmentsStatsBar stats={shipmentStats} onStatClick={handleStatClick} />
            </ACLGuard>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Shipping Method Tabs */}
          <Tabs value={activeMethodTab} onValueChange={handleMethodTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/50 p-1.5">
              <TabsTrigger value="all" className="gap-2 text-base">
                <Package className="h-5 w-5" />
                {t('shipments.tabs.all')}
              </TabsTrigger>
              <TabsTrigger value="air" className="gap-2 text-base">
                <Plane className="h-5 w-5" />
                {t('shipments.table.method.air')}
              </TabsTrigger>
              <TabsTrigger value="sea" className="gap-2 text-base">
                <Ship className="h-5 w-5" />
                {t('shipments.table.method.sea')}
              </TabsTrigger>
              <TabsTrigger value="land" className="gap-2 text-base">
                <Truck className="h-5 w-5" />
                {t('shipments.table.method.land')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 relative z-20">
            <div className="flex-1">
              <ShipmentsFilters
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
                fetchShipments();
                fetchStats();
              }}
              className="shrink-0 cursor-pointer"
              title={t('shipments.actions.refresh')}
            >
              <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {hasError && (
            <InlineError message={errorMessage} />
          )}

          {showLoadingSkeleton ? (
            <div className="space-y-3">
              {[...Array(filters.limit || 10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-2">{t('shipments.empty.title')}</h3>
              <p className="text-muted-foreground">{t('shipments.empty.description')}</p>
            </div>
          ) : (
            <ShipmentsTable
              shipments={shipments}
              selectedShipments={selectedShipments}
              onSelectShipment={handleSelectShipment}
              onSelectAll={handleSelectAll}
              onEdit={handleEditShipment}
              onDelete={handleDeleteShipment}
              visibleColumns={visibleColumns}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}

          {!showLoadingSkeleton && shipments.length > 0 && (
            <ShipmentsPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalDocs}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          )}
        </motion.div>

        {/* Dialogs */}
        <CreateShipmentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateSuccess}
        />
        
        {shipmentToEdit && (
          <EditShipmentDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            shipment={shipmentToEdit}
            onSuccess={handleEditSuccess}
          />
        )}
        
        {shipmentToDelete && (
          <DeleteShipmentDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            shipment={shipmentToDelete}
            onSuccess={handleDeleteSuccess}
          />
        )}
        
        <BulkUpdateDialog
          open={showBulkUpdateDialog}
          onOpenChange={setShowBulkUpdateDialog}
          selectedShipmentIds={Array.from(selectedShipments)}
          onSuccess={handleBulkSuccess}
        />
        
        <BulkDeleteDialog
          open={showBulkDeleteDialog}
          onOpenChange={setShowBulkDeleteDialog}
          selectedShipmentIds={Array.from(selectedShipments)}
          onSuccess={handleBulkSuccess}
        />
        
        <BarcodeScanDialog
          open={showBarcodeScanDialog}
          onOpenChange={setShowBarcodeScanDialog}
          onSuccess={handleBulkSuccess}
        />
      </div>
    </ACLGuard>
  );
}
