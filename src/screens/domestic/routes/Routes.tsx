import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Route as RouteIcon, MoreHorizontal, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CityCombobox } from '@/components/domestic/CityCombobox';
import { listRoutes } from '@/utilities/api/routes.api';
import { titleCaseCity } from '@/data/domesticCities';
import { RouteFormDrawer } from './RouteFormDrawer';
import { DeleteRouteDialog } from './DeleteRouteDialog';
import type { DomesticCity, Route } from '@/types/domestic';

dayjs.extend(relativeTime);

const LIMIT = 50;

function fmtLyd(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

export default function DomesticRoutesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [originCity, setOriginCity] = useState<DomesticCity | ''>('');
  const [destinationCity, setDestinationCity] = useState<DomesticCity | ''>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [deleting, setDeleting] = useState<Route | null>(null);

  const queryKey = useMemo(
    () => ['routes', { page, limit: LIMIT, originCity: originCity || undefined, destinationCity: destinationCity || undefined }] as const,
    [page, originCity, destinationCity]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      listRoutes({
        page,
        limit: LIMIT,
        originCity: originCity || undefined,
        destinationCity: destinationCity || undefined,
      }),
  });

  const docs = data?.docs ?? [];
  const total = data?.totalDocs ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (r: Route) => {
    setEditing(r);
    setDrawerOpen(true);
  };

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <RouteIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('domestic.admin.routes.title', 'Routes')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t(
                'domestic.admin.routes.subtitle',
                'Origin → destination price directory for domestic shipping.'
              )}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('domestic.admin.routes.create', 'New route')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Origin</span>
            <CityCombobox
              value={originCity}
              onChange={(v) => {
                setOriginCity(v);
                setPage(1);
              }}
              placeholder="All origins"
              allowClear
              onClear={() => {
                setOriginCity('');
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Destination</span>
            <CityCombobox
              value={destinationCity}
              onChange={(v) => {
                setDestinationCity(v);
                setPage(1);
              }}
              placeholder="All destinations"
              allowClear
              onClear={() => {
                setDestinationCity('');
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <RouteIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No routes yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first origin → destination price entry to start pricing domestic shipments.
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create your first route
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Tier A</TableHead>
                  <TableHead className="text-right">Tier B</TableHead>
                  <TableHead className="text-right">Tier C</TableHead>
                  <TableHead className="text-right">Tier D</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((r) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b transition-colors hover:bg-muted/40 cursor-pointer"
                    onClick={() => openEdit(r)}
                  >
                    <TableCell className="font-medium">
                      {titleCaseCity(r.originCity)}{' '}
                      <span className="text-muted-foreground">→</span> {titleCaseCity(r.destinationCity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtLyd(r.priceTierA)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtLyd(r.priceTierB)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtLyd(r.priceTierC)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtLyd(r.priceTierD)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm" title={r.updatedAt}>
                      {dayjs(r.updatedAt).fromNow()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(r)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {total}
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
                <span className="text-sm">
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
          </>
        )}
      </Card>

      <RouteFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} route={editing} />
      <DeleteRouteDialog
        route={deleting}
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </div>
  );
}