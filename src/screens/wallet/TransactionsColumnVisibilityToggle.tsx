import { useTranslation } from 'react-i18next';
import { Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface ColumnVisibilityToggleProps {
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  onReset: () => void;
}

const TOGGLEABLE_COLUMNS = [
  { key: 'type', labelKey: 'wallet.table.columns.type' },
  { key: 'description', labelKey: 'wallet.table.columns.description' },
  { key: 'date', labelKey: 'wallet.table.columns.date' },
  { key: 'status', labelKey: 'wallet.table.columns.status' },
  { key: 'reference', labelKey: 'wallet.table.columns.reference' },
  { key: 'balanceBefore', labelKey: 'wallet.table.columns.balanceBefore' },
  { key: 'balanceAfter', labelKey: 'wallet.table.columns.balanceAfter' },
];

export function TransactionsColumnVisibilityToggle({
  visibleColumns,
  onToggleColumn,
  onReset,
}: ColumnVisibilityToggleProps) {
  const { t } = useTranslation();

  const hiddenCount = TOGGLEABLE_COLUMNS.filter(
    (col) => !visibleColumns.has(col.key)
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Columns className="h-4 w-4" />
          {t('wallet.columns.visibility')}
          {hiddenCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({t('wallet.columns.hiddenCount', { count: hiddenCount })})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('wallet.columns.showHide')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TOGGLEABLE_COLUMNS.map((column) => (
          <DropdownMenuItem
            key={column.key}
            className="gap-2 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              onToggleColumn(column.key);
            }}
          >
            <Checkbox
              checked={visibleColumns.has(column.key)}
              onCheckedChange={() => onToggleColumn(column.key)}
            />
            <span>{t(column.labelKey)}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset} className="cursor-pointer">
          {t('wallet.columns.resetDefault')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
