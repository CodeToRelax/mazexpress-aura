import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Truck, PackagePlus, Coins, Loader2, RefreshCw, Receipt } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getShipmentTransactions } from '@/utilities/api/domesticShipments.api';
import type { WalletTransaction } from '@/types/domestic';

dayjs.extend(relativeTime);

interface Props {
  shipmentId: string;
  senderUserId: string;
}

function fmtLyd(n: number) {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))} LYD`;
}

function txIcon(type: string) {
  if (type === 'domestic_shipping_charge') return <Truck className="h-4 w-4" />;
  if (type === 'domestic_item_credit') return <PackagePlus className="h-4 w-4" />;
  return <Coins className="h-4 w-4" />;
}

function statusPill(status?: string) {
  if (!status || status === 'completed') return null;
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200',
    failed: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200',
    reversed: 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${map[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

export function ShipmentTransactionsCard({ shipmentId, senderUserId }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['domestic-shipment-transactions', { id: shipmentId, senderUserId }] as const,
    queryFn: () => getShipmentTransactions(senderUserId, shipmentId, 10),
    enabled: !!senderUserId,
  });

  const docs: WalletTransaction[] = data?.docs ?? [];
  const total = data?.totalDocs ?? 0;

  return (
    <Card className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">
            {t('domestic.admin.detail.tx-title', 'Wallet transactions for this shipment')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['domestic-shipment-transactions', { id: shipmentId }] });
            refetch();
          }}
          aria-label="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t(
            'domestic.admin.detail.tx-empty',
            'No wallet transactions yet. Postings appear when shipping is debited or items are credited.'
          )}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          <TooltipProvider>
            {docs.map((tx) => (
              <li key={tx._id} className="py-2 flex items-center gap-3">
                <span className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  {txIcon(tx.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate">{tx.description ?? tx.type}</span>
                    {statusPill(tx.status)}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[11px] text-muted-foreground">
                        {dayjs(tx.createdAt).fromNow()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-xs">
                        {dayjs(tx.createdAt).format('YYYY-MM-DD HH:mm')}
                        {tx.transactionNumber ? ` · ${tx.transactionNumber}` : ''}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span
                  className={`text-sm font-mono tabular-nums ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : tx.amount < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}
                >
                  {fmtLyd(tx.amount)}
                </span>
              </li>
            ))}
          </TooltipProvider>
        </ul>
      )}

      {total > 5 && (
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => navigate(`/wallet/transactions?userId=${senderUserId}`)}
        >
          {t('domestic.admin.detail.tx-view-all', 'View all transactions')}
        </Button>
      )}
    </Card>
  );
}