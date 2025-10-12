import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RotateCw, Download, FileText, Printer, Warehouse } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineError } from '@/components/feedback/InlineError';
import { Skeleton } from '@/components/ui/skeleton';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { WarehousesStatsBar } from './WarehousesStatsBar';
import { WarehousesFilters } from './WarehousesFilters';
import { WarehousesTable } from './WarehousesTable';
import { WarehousesPagination } from './WarehousesPagination';
import { CreateWarehouseDialog } from './CreateWarehouseDialog';
import { getWarehouses } from '@/utilities/api/warehouses.api';
import type { WarehouseFilters } from '@/types/warehouse';
import { exportWarehousesToCSV } from '@/utilities/helpers/warehouseExport';
import { generateWarehousesPDF } from '@/utilities/helpers/warehousePDF';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Warehouses() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<WarehouseFilters>({
    page: 1,
    limit: 10,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch warehouses
  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['warehouses', filters],
    queryFn: () => getWarehouses(filters),
    staleTime: 0,
  });

  const warehouses = response?.data.warehouses || [];
  const pagination = response?.data.pagination;

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<WarehouseFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Handle successful warehouse creation
  const handleWarehouseCreated = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      if (warehouses.length === 0) {
        toast({
          title: t('status.error'),
          description: 'No warehouses to export',
          variant: 'destructive',
        });
        return;
      }
      exportWarehousesToCSV(warehouses);
      toast({
        title: t('status.success'),
        description: 'Warehouses exported successfully',
      });
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : 'Export failed',
        variant: 'destructive',
      });
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    try {
      // Show loading toast
      toast({
        title: 'Loading...',
        description: 'Fetching all warehouses...',
      });

      // Fetch all warehouses without pagination
      const allWarehousesResponse = await getWarehouses({});
      const allWarehouses = allWarehousesResponse.data.warehouses || [];
      
      // Filter for open warehouses
      const openWarehouses = allWarehouses.filter((w) => w.status === 'open');
      
      if (openWarehouses.length === 0) {
        toast({
          title: t('status.error'),
          description: 'No open warehouses available for PDF generation',
          variant: 'destructive',
        });
        return;
      }
      
      generateWarehousesPDF(openWarehouses);
      toast({
        title: t('status.success'),
        description: `Generating PDF for ${openWarehouses.length} open warehouse(s)`,
      });
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : 'PDF generation failed',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <InlineError
          message={error instanceof Error ? error.message : t('warehouses.messages.error')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('warehouses.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('warehouses.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Print PDF Button */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleGeneratePDF}
              title="Generate PDF for all open warehouses"
            >
              <Printer className="h-4 w-4" />
            </Button>

            <ACLGuard flag="canManageWarehouses">
              <Button onClick={() => setIsCreateDialogOpen(true)} size="default">
                <Plus className="h-4 w-4 mr-2" />
                {t('warehouses.actions.create')}
              </Button>
            </ACLGuard>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <WarehousesStatsBar warehouses={warehouses} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Card className="p-4 flex-1">
          <WarehousesFilters filters={filters} onFilterChange={handleFilterChange} />
        </Card>
        <Button
          variant="outline"
          size="icon"
          onClick={async () => {
            await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            refetch();
          }}
          className="shrink-0"
          title={t('warehouses.actions.refresh')}
          disabled={isFetching}
        >
          <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      {(isLoading || isFetching) ? (
        <Card className="p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <WarehousesTable warehouses={warehouses} onRefetch={refetch} />
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <WarehousesPagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Create Dialog */}
      <CreateWarehouseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleWarehouseCreated}
      />
    </div>
  );
}
