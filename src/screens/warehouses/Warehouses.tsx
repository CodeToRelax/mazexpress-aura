import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RotateCw, Download, FileText } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const handleGeneratePDF = () => {
    try {
      const openWarehouses = warehouses.filter((w) => w.status === 'open');
      if (openWarehouses.length === 0) {
        toast({
          title: t('status.error'),
          description: 'No open warehouses available for PDF generation',
          variant: 'destructive',
        });
        return;
      }
      generateWarehousesPDF(warehouses);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('warehouses.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('warehouses.subtitle')}</p>
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
              <DropdownMenuItem onClick={handleGeneratePDF}>
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF (Open Only)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ACLGuard flag="canManageWarehouses">
            <Button onClick={() => setIsCreateDialogOpen(true)} size="default">
              <Plus className="h-4 w-4 mr-2" />
              {t('warehouses.actions.create')}
            </Button>
          </ACLGuard>
        </div>
      </div>

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
          className="shrink-0 pointer-events-auto"
          style={{ position: 'relative', zIndex: 9999 }}
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
