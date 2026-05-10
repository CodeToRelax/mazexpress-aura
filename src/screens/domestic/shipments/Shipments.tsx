import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listAdminShipments, bulkUpdateStatus } from '@/utilities/api/domesticShipments.api';
import { StatusTabs } from './StatusTabs';
import { ShipmentsFilters, type ShipmentsFilterState } from './ShipmentsFilters';
import { ShipmentsTable } from './ShipmentsTable';
import { DOMESTIC_STATUSES, type DomesticStatus } from '@/types/domestic';
import { toast } from 'sonner';

const LIMIT = 20;

export default function DomesticShipmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<DomesticStatus | 'all'>('all');
  const [filters, setFilters] = useState<ShipmentsFilterState>({
    q: '',
    originCity: '',
    destinationCity: '',
    senderUserId: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<DomesticStatus | ''>('');
  const [bulkNote, setBulkNote] = useState('');

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

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = (ids: string[], select: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (select) ids.forEach((i) => next.add(i));
      else ids.forEach((i) => next.delete(i));
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatus('');
    setBulkNote('');
  };

  const bulkMutation = useMutation({
    mutationFn: () =>
      bulkUpdateStatus(Array.from(selectedIds), bulkStatus as DomesticStatus, bulkNote || undefined),
    onSuccess: (res) => {
      if (res.failCount > 0) {
        toast.warning(
          t('domestic.admin.shipments.bulk-partial', '{{ok}} updated, {{fail}} failed.', {
            ok: res.successCount,
            fail: res.failCount,
          })
        );
      } else {
        toast.success(
          t('domestic.admin.shipments.bulk-success', '{{ok}} shipments updated.', {
            ok: res.successCount,
          })
        );
      }
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      clearSelection();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Bulk update failed'),
  });

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

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-3 sticky top-2 z-20">
          <span className="text-sm font-medium">
            {t('domestic.admin.shipments.bulk-selected', '{{n}} selected', { n: selectedIds.size })}
          </span>
          <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as DomesticStatus)}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder={t('domestic.admin.shipments.bulk-pick-status', 'Change status to…')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900">
              {DOMESTIC_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`domestic.status.${s}`, s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            placeholder={t('domestic.admin.shipments.bulk-note', 'Optional note')}
            className="h-9 max-w-xs"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection} disabled={bulkMutation.isPending}>
              <X className="h-3.5 w-3.5 mr-1" />
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              disabled={!bulkStatus || bulkMutation.isPending}
              onClick={() => bulkMutation.mutate()}
            >
              {bulkMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              {t('domestic.admin.shipments.bulk-apply', 'Apply')}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <ShipmentsTable
        shipments={docs}
        isLoading={isLoading}
        onRowClick={(s) => navigate(`/admin/domestic/shipments/${s._id}`)}
        selectedIds={selectedIds}
        onToggleId={toggleId}
        onToggleAll={toggleAll}
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