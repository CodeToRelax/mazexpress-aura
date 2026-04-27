import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ArrowLeft,
  Loader2,
  Copy,
  Phone,
  Pencil,
  MoreHorizontal,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Package,
  User as UserIcon,
  ArrowRight,
  ChevronsUpDown,
  Truck,
  PackagePlus,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DomesticStatusChip } from '@/components/domestic/DomesticStatusChip';
import { TierChip } from '@/components/domestic/TierChip';
import { titleCaseCity } from '@/data/domesticCities';
import {
  getAdminShipment,
  softDeleteShipment,
} from '@/utilities/api/domesticShipments.api';
import { ChangeStatusPopover } from './ChangeStatusPopover';
import { EditShipmentDialog } from './EditShipmentDialog';
import { ShipmentTransactionsCard } from './ShipmentTransactionsCard';
import { toast } from 'sonner';
import type { PopulatedSender, StatusHistoryEntry } from '@/types/domestic';

dayjs.extend(relativeTime);

function fmtLyd(n: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
}

function copy(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text).then(() => toast.success(label));
}

function senderOf(sid: unknown): PopulatedSender | null {
  if (!sid || typeof sid === 'string') return null;
  return sid as PopulatedSender;
}

export default function DomesticShipmentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['domestic-shipment', id] as const,
    queryFn: () => getAdminShipment(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteShipment(id!),
    onSuccess: () => {
      toast.success(t('domestic.admin.detail.deleted', 'Shipment soft-deleted.'));
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      qc.invalidateQueries({ queryKey: ['domestic-shipment', id] });
      setDeleteOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.shipment) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/domestic/shipments')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.back', 'Back')}
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : t('domestic.admin.detail.load-error', 'Failed to load shipment.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { shipment, history } = data;
  const sender = senderOf(shipment.senderUserId);
  const senderId = typeof shipment.senderUserId === 'string' ? shipment.senderUserId : sender?._id ?? '';
  const isSoftDeleted = !!shipment.deletedAt;
  const deltaShipping =
    shipment.shippingChargedAt &&
    typeof shipment.shippingChargedAmount === 'number' &&
    shipment.shippingChargedAmount !== shipment.shippingPrice;
  const deltaItem =
    shipment.itemCreditedAt &&
    typeof shipment.itemCreditedAmount === 'number' &&
    shipment.itemCreditedAmount !== shipment.itemPrice;

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/domestic/shipments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-mono">#{shipment.shipmentNumber}</h1>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => copy(shipment.shipmentNumber, 'Number copied')}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <DomesticStatusChip status={shipment.status} />
            {shipment.creationSource === 'walk_in' && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                {t('domestic.admin.detail.walk-in', 'Walk-in')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {titleCaseCity(shipment.originCity)} <ArrowRight className="inline h-3 w-3 mx-1" />{' '}
            {titleCaseCity(shipment.recipient.city)} ·{' '}
            <span title={shipment.createdAt}>{dayjs(shipment.createdAt).fromNow()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChangeStatusPopover
            shipment={shipment}
            trigger={
              <Button variant="default" className="gap-2">
                {t('domestic.admin.detail.change-status', 'Change status')}
                <ChevronsUpDown className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            {t('common.edit', 'Edit')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={isSoftDeleted}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {t('domestic.admin.detail.delete', 'Soft delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isSoftDeleted && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t(
              'domestic.admin.detail.soft-deleted-banner',
              'This shipment has been soft-deleted on {{date}} and is hidden from lists.',
              { date: dayjs(shipment.deletedAt!).format('YYYY-MM-DD HH:mm') }
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pricing & wallet */}
          <Card className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {t('domestic.admin.detail.pricing-title', 'Pricing & wallet')}
              </h3>
              <TierChip tier={shipment.tier} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  {t('domestic.admin.detail.shipping-price', 'Shipping price')}
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {fmtLyd(shipment.shippingPrice)} <span className="text-base font-normal text-muted-foreground">LYD</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('domestic.admin.detail.paid-by', 'Paid by')}: {t(`domestic.paid-by.${shipment.shippingPaidBy}`, shipment.shippingPaidBy)}
                </div>
                {shipment.shippingChargedAt ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('domestic.admin.detail.charged-on', 'Charged on {{date}}', {
                      date: dayjs(shipment.shippingChargedAt).format('YYYY-MM-DD HH:mm'),
                    })}
                    {' · '}
                    {fmtLyd(shipment.shippingChargedAmount)} LYD
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    {t('domestic.admin.detail.not-charged', 'Wallet not yet charged')}
                  </div>
                )}
                {deltaShipping && (
                  <Alert className="py-2 mt-2">
                    <AlertDescription className="text-xs">
                      {t(
                        'domestic.admin.detail.delta-shipping',
                        'Original charge differs from current price; backend will post a delta on next change.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PackagePlus className="h-3.5 w-3.5" />
                  {t('domestic.admin.detail.item-price', 'Item price')}
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {fmtLyd(shipment.itemPrice)} <span className="text-base font-normal text-muted-foreground">LYD</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('domestic.admin.detail.paid-by', 'Paid by')}: {t(`domestic.paid-by.${shipment.itemPaidBy}`, shipment.itemPaidBy)}
                </div>
                {shipment.itemCreditedAt ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('domestic.admin.detail.credited-on', 'Credited on {{date}}', {
                      date: dayjs(shipment.itemCreditedAt).format('YYYY-MM-DD HH:mm'),
                    })}
                    {' · '}
                    {fmtLyd(shipment.itemCreditedAmount)} LYD
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    {t('domestic.admin.detail.not-credited', 'Wallet not yet credited')}
                  </div>
                )}
                {deltaItem && (
                  <Alert className="py-2 mt-2">
                    <AlertDescription className="text-xs">
                      {t(
                        'domestic.admin.detail.delta-item',
                        'Original credit differs from current item price.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </Card>

          {/* Wallet transactions */}
          {senderId && (
            <ShipmentTransactionsCard shipmentId={shipment._id} senderUserId={senderId} />
          )}

          {/* Sender card */}
          <Card className="glass-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{t('domestic.admin.detail.sender', 'Sender')}</h3>
            </div>
            {sender ? (
              <div className="space-y-1 text-sm">
                <div className="font-medium">
                  {sender.firstName} {sender.lastName}
                </div>
                {sender.uniqueShippingNumber && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {sender.uniqueShippingNumber}
                  </div>
                )}
                {sender.phoneNumber && (
                  <a href={`tel:${sender.phoneNumber}`} className="text-xs text-primary inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {sender.phoneNumber}
                  </a>
                )}
                {sender.email && <div className="text-xs text-muted-foreground">{sender.email}</div>}
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto"
                  onClick={() => navigate(`/users/${sender._id}`)}
                >
                  {t('domestic.admin.detail.view-customer', 'View customer profile')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('domestic.admin.detail.no-sender-data', 'Sender details not loaded.')}
              </p>
            )}
          </Card>

          {/* Recipient card */}
          <Card className="glass-card p-5 space-y-2">
            <h3 className="font-semibold">{t('domestic.admin.detail.recipient', 'Recipient')}</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">{shipment.recipient.name}</div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${shipment.recipient.primaryPhone}`}
                  className="text-primary inline-flex items-center gap-1 text-xs"
                >
                  <Phone className="h-3 w-3" /> {shipment.recipient.primaryPhone}
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => copy(shipment.recipient.primaryPhone, 'Phone copied')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {shipment.recipient.alternatePhone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${shipment.recipient.alternatePhone}`}
                    className="text-primary inline-flex items-center gap-1 text-xs"
                  >
                    <Phone className="h-3 w-3" /> {shipment.recipient.alternatePhone}
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copy(shipment.recipient.alternatePhone!, 'Phone copied')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {titleCaseCity(shipment.recipient.city)} · {shipment.recipient.address}
              </div>
            </div>
          </Card>

          {/* Item card */}
          <Card className="glass-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{t('domestic.admin.detail.item', 'Item')}</h3>
            </div>
            <div className="text-sm space-y-1">
              <div>{shipment.description}</div>
              <div className="text-xs text-muted-foreground">
                {t('domestic.admin.detail.qty', 'Qty')}: {shipment.quantity} ·{' '}
                {t('domestic.admin.detail.price', 'Price')}: {fmtLyd(shipment.itemPrice)} LYD ·{' '}
                {t('domestic.admin.detail.paid-by', 'Paid by')}: {t(`domestic.paid-by.${shipment.itemPaidBy}`, shipment.itemPaidBy)}
              </div>
            </div>
          </Card>

          {/* Options card */}
          {(shipment.options?.fragile || shipment.options?.storeOnDeliveryFailure || shipment.options?.insurance) && (
            <Card className="glass-card p-5 space-y-2">
              <h3 className="font-semibold">{t('domestic.admin.detail.options', 'Options')}</h3>
              <div className="flex flex-wrap gap-2">
                {shipment.options?.fragile && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-200">
                    {t('domestic.admin.shipments.options.fragile', 'Fragile')}
                  </span>
                )}
                {shipment.options?.storeOnDeliveryFailure && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200">
                    {t('domestic.admin.shipments.options.store', 'Store on failure')}
                  </span>
                )}
                {shipment.options?.insurance && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200">
                    {t('domestic.admin.shipments.options.insurance', 'Insurance')}
                  </span>
                )}
              </div>
            </Card>
          )}

          {shipment.notes && (
            <Card className="glass-card p-5 space-y-2">
              <h3 className="font-semibold">{t('domestic.admin.detail.notes', 'Notes')}</h3>
              <p className="text-sm whitespace-pre-wrap">{shipment.notes}</p>
            </Card>
          )}
        </div>

        {/* Right column — timeline */}
        <div className="space-y-4">
          <Card className="glass-card p-5 space-y-4">
            <h3 className="font-semibold">{t('domestic.admin.detail.history', 'Status history')}</h3>
            <ol className="relative border-s border-border ms-2 space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground ms-2">
                  {t('domestic.admin.detail.history-empty', 'No history yet.')}
                </p>
              ) : (
                [...history]
                  .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
                  .map((h: StatusHistoryEntry) => (
                    <motion.li
                      key={h._id}
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ms-4"
                    >
                      <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {h.fromStatus && <DomesticStatusChip status={h.fromStatus} size="sm" />}
                        {h.fromStatus && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                        <DomesticStatusChip status={h.toStatus} size="sm" />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {h.postedShippingCharge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200">
                            {t('domestic.admin.detail.posted-shipping', 'Shipping charged')}
                          </span>
                        )}
                        {h.postedItemCredit && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200">
                            {t('domestic.admin.detail.posted-item', 'Item credited')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {h.changedByUserId
                          ? `${h.changedByUserId.firstName ?? ''} ${h.changedByUserId.lastName ?? ''}`.trim() ||
                            h.changedByUserId.email ||
                            t('domestic.admin.detail.system', 'System')
                          : t('domestic.admin.detail.system', 'System')}{' '}
                        · {dayjs(h.createdAt).fromNow()}
                      </p>
                      {h.note && (
                        <p className="text-xs mt-1 p-2 rounded bg-muted/40">{h.note}</p>
                      )}
                    </motion.li>
                  ))
              )}
            </ol>
          </Card>
        </div>
      </div>

      <EditShipmentDialog open={editOpen} onOpenChange={setEditOpen} shipment={shipment} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('domestic.admin.detail.delete-title', 'Soft delete this shipment?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'domestic.admin.detail.delete-confirm',
                'It will be hidden from lists but the record (and any wallet postings) is preserved.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('domestic.admin.detail.delete', 'Soft delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}