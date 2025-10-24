import { Columns3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface WalletsColumnVisibilityToggleProps {
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  onReset: () => void;
}

const TOGGLEABLE_COLUMNS = [
  { key: 'email', labelKey: 'wallets.table.columns.email' },
  { key: 'phone', labelKey: 'wallets.table.columns.phone' },
  { key: 'role', labelKey: 'wallets.table.columns.role' },
  { key: 'status', labelKey: 'wallets.table.columns.status' },
  { key: 'country', labelKey: 'wallets.table.columns.country' },
  { key: 'joined', labelKey: 'wallets.table.columns.joined' },
];

export function WalletsColumnVisibilityToggle({
  visibleColumns,
  onToggleColumn,
  onReset,
}: WalletsColumnVisibilityToggleProps) {
  const { t } = useTranslation();

  const hiddenCount = TOGGLEABLE_COLUMNS.length - visibleColumns.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">{t('wallets.columns.visibility')}</span>
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {t('wallets.columns.hiddenCount', { count: hiddenCount })}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card z-50">
        <DropdownMenuLabel>{t('wallets.columns.showHide')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TOGGLEABLE_COLUMNS.map((column) => (
          <DropdownMenuItem
            key={column.key}
            onClick={(e) => {
              e.preventDefault();
              onToggleColumn(column.key);
            }}
            className="cursor-pointer"
          >
            <Checkbox
              checked={visibleColumns.has(column.key)}
              onCheckedChange={() => onToggleColumn(column.key)}
              className="mr-2"
            />
            {t(column.labelKey)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset} className="cursor-pointer">
          {t('wallets.columns.resetDefault')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
