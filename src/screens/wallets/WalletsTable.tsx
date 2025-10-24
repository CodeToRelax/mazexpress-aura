import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CheckCircle2,
  XCircle,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Wallet as WalletIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface WalletView {
  walletId: string;
  walletIdDisplay: string;
  ownerName: string;
  ownerEmail: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  userId: string;
}

interface WalletsTableProps {
  wallets: WalletView[];
  selectedWallets: Set<string>;
  onSelectWallet: (walletId: string) => void;
  onSelectAll: (checked: boolean) => void;
  visibleColumns?: Set<string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function WalletsTable({
  wallets,
  selectedWallets,
  onSelectWallet,
  onSelectAll,
  visibleColumns = new Set(['email', 'balance', 'currency', 'status', 'created']),
  sortBy,
  sortOrder,
  onSort,
}: WalletsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    );
  };

  const renderSortableHeader = (column: string, label: string) => {
    const isSortable = onSort && ['owner', 'email', 'balance', 'created'].includes(column);
    
    if (!isSortable) {
      return label;
    }

    return (
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label={t('wallets.table.sortBy', { column: label })}
      >
        <span>{label}</span>
        {getSortIcon(column)}
      </button>
    );
  };

  const allSelected = wallets.length > 0 && wallets.every(wallet => selectedWallets.has(wallet.walletId));
  const someSelected = wallets.some(wallet => selectedWallets.has(wallet.walletId)) && !allSelected;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || someSelected}
                onCheckedChange={onSelectAll}
                aria-label={t('wallets.table.selectAll')}
              />
            </TableHead>
            <TableHead>{t('wallets.table.columns.walletId')}</TableHead>
            <TableHead>{renderSortableHeader('owner', t('wallets.table.columns.owner'))}</TableHead>
            {visibleColumns.has('email') && <TableHead>{renderSortableHeader('email', t('wallets.table.columns.email'))}</TableHead>}
            {visibleColumns.has('balance') && <TableHead>{renderSortableHeader('balance', t('wallets.table.columns.balance'))}</TableHead>}
            {visibleColumns.has('currency') && <TableHead>{t('wallets.table.columns.currency')}</TableHead>}
            {visibleColumns.has('status') && <TableHead>{t('wallets.table.columns.status')}</TableHead>}
            {visibleColumns.has('created') && <TableHead>{renderSortableHeader('created', t('wallets.table.columns.created'))}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((wallet) => (
            <TableRow 
              key={wallet.walletId}
              className="cursor-pointer hover:bg-accent/20 transition-colors duration-150"
              onClick={() => navigate(`/users/${wallet.userId}?tab=wallet`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedWallets.has(wallet.walletId)}
                  onCheckedChange={() => onSelectWallet(wallet.walletId)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <WalletIcon className="h-4 w-4" />
                  <span className="font-mono text-sm">{wallet.walletIdDisplay}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">
                  {wallet.ownerName}
                </div>
              </TableCell>
              {visibleColumns.has('email') && (
                <TableCell className="text-muted-foreground">{wallet.ownerEmail}</TableCell>
              )}
              {visibleColumns.has('balance') && (
                <TableCell>
                  <span className="font-semibold text-foreground">{formatLYD(wallet.balance)}</span>
                </TableCell>
              )}
              {visibleColumns.has('currency') && (
                <TableCell className="text-muted-foreground uppercase">{wallet.currency}</TableCell>
              )}
              {visibleColumns.has('status') && (
                <TableCell>
                  <Badge variant={wallet.isActive ? 'default' : 'destructive'} className="gap-1">
                    {wallet.isActive ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {t(`wallets.table.status.${wallet.isActive ? 'active' : 'inactive'}`)}
                  </Badge>
                </TableCell>
              )}
              {visibleColumns.has('created') && (
                <TableCell className="text-muted-foreground">
                  {format(new Date(wallet.createdAt), 'MMM dd, yyyy')}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
