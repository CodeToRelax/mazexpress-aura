import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listAdminShipments } from '@/utilities/api/domesticShipments.api';
import { StatusTabs } from './StatusTabs';
import { ShipmentsFilters, type ShipmentsFilterState } from './ShipmentsFilters';
import { ShipmentsTable } from './ShipmentsTable';
import type { DomesticStatus } from '@/types/domestic';

const LIMIT = 20;

export default function DomesticShipmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<DomesticStatus | 'all'>('all');
  const [filters, setFilters] = useState<ShipmentsFilterState>({
    q: '',
    originCity: '',
    destinationCity: '',
    senderUserId: '',
  });

  const queryArgs = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status: statusTab === 'all' ? undefined : statusTab,
      q: filters.q || undefined,
      originCity: filters.originCity || undefined,
      destinationCity: filters.destinationCity || undefined,
      senderUserId: filters.senderUserId || undefined,
    }),
    [page, statusTab, filters]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['domestic-shipments', queryArgs] as const,
    queryFn: () => listAdminShipments(queryArgs),
  });

  const docs = data?.docs ?? [];
  const total = data?.totalDocs ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('domestic.admin.shipments.title', 'Domestic Shipments')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t(
                'domestic.admin.shipments.subtitle',
                'Manage city-to-city shipments inside Libya.'
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/admin/domestic/shipments/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('domestic.admin.shipments.create', 'New walk-in shipment')}
        </Button>
      </div>

      {/* Tabs */}
      <StatusTabs
        value={statusTab}
        onChange={(v) => {
          setStatusTab(v);
          setPage(1);
        }}
      />

      {/* Filters */}
      <ShipmentsFilters
        state={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {/* Table */}
      <ShipmentsTable
        shipments={docs}
        isLoading={isLoading}
        onRowClick={(s) => navigate(`/admin/domestic/shipments/${s._id}`)}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('domestic.admin.shipments.showing', 'Showing {{from}}-{{to}} of {{total}}', {
              from: showingFrom,
              to: showingTo,
              total,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}