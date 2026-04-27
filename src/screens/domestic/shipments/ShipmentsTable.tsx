import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Copy, MoreHorizontal, Package, CheckCircle2, Loader2, Phone } from 'lucide-react';
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
import { DomesticStatusChip } from '@/components/domestic/DomesticStatusChip';
import { TierChip } from '@/components/domestic/TierChip';
import { titleCaseCity } from '@/data/domesticCities';
import { toast } from 'sonner';
import type { DomesticShipment, PopulatedSender } from '@/types/domestic';

dayjs.extend(relativeTime);

interface Props {
  shipments: DomesticShipment[];
  isLoading: boolean;
  onRowClick: (s: DomesticShipment) => void;
}

function senderOf(s: DomesticShipment): PopulatedSender | null {
  if (!s.senderUserId) return null;
  if (typeof s.senderUserId === 'string') return null;
  return s.senderUserId;
}

function fmtLyd(n: number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function copy(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text).then(() => toast.success(label));
}

export function ShipmentsTable({ shipments, isLoading, onRowClick }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="glass-card flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (shipments.length === 0) {
    return (
      <Card className="glass-card flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-1">
          {t('domestic.admin.shipments.empty.title', 'No shipments found')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t(
            'domestic.admin.shipments.empty.description',
            'Try adjusting filters or create a new walk-in shipment.'
          )}
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('domestic.admin.shipments.col.number', 'Number')}</TableHead>
              <TableHead>{t('domestic.admin.shipments.col.status', 'Status')}</TableHead>
              <TableHead>{t('domestic.admin.shipments.col.route', 'Route')}</TableHead>
              <TableHead>{t('domestic.admin.shipments.col.sender', 'Sender')}</TableHead>
              <TableHead>{t('domestic.admin.shipments.col.recipient', 'Recipient')}</TableHead>
              <TableHead>{t('domestic.admin.shipments.col.tier', 'Tier')}</TableHead>
              <TableHead className="text-right">
                {t('domestic.admin.shipments.col.shipping', 'Shipping')}
              </TableHead>
              <TableHead className="text-right">
                {t('domestic.admin.shipments.col.item', 'Item')}
              </TableHead>
              <TableHead>{t('domestic.admin.shipments.col.created', 'Created')}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((s) => {
              const sender = senderOf(s);
              return (
                <motion.tr
                  key={s._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b transition-colors hover:bg-muted/40 cursor-pointer"
                  onClick={() => onRowClick(s)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="font-mono text-xs">
                    <button
                      onClick={() => copy(s.shipmentNumber, 'Shipment number copied')}
                      className="inline-flex items-center gap-1 hover:text-primary"
                      title={s.shipmentNumber}
                    >
                      {s.shipmentNumber}
                      <Copy className="h-3 w-3 opacity-60" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <DomesticStatusChip status={s.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-sm">
                    {titleCaseCity(s.originCity)}{' '}
                    <span className="text-muted-foreground">→</span>{' '}
                    {titleCaseCity(s.recipient.city)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sender ? (
                      <div className="flex flex-col leading-tight">
                        <span className="truncate max-w-[180px]">
                          {sender.firstName ?? ''} {sender.lastName ?? ''}
                        </span>
                        {sender.uniqueShippingNumber && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {sender.uniqueShippingNumber}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col leading-tight">
                      <span className="truncate max-w-[180px]">{s.recipient.name}</span>
                      <a
                        href={`tel:${s.recipient.primaryPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                      >
                        <Phone className="h-2.5 w-2.5" />
                        {s.recipient.primaryPhone}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TierChip tier={s.tier} size="sm" />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    <div className="flex flex-col items-end">
                      <span>{fmtLyd(s.shippingPrice)}</span>
                      {s.shippingChargedAt && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {t('domestic.admin.shipments.charged', 'Charged')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    <div className="flex flex-col items-end">
                      <span>{fmtLyd(s.itemPrice)}</span>
                      {s.itemCreditedAt && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {t('domestic.admin.shipments.credited', 'Credited')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-muted-foreground text-xs whitespace-nowrap"
                    title={s.createdAt}
                  >
                    {dayjs(s.createdAt).fromNow()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/domestic/shipments/${s._id}`)}>
                          {t('domestic.admin.shipments.actions.view', 'View details')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copy(s.shipmentNumber, 'Number copied')}>
                          {t('domestic.admin.shipments.actions.copy-number', 'Copy number')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}