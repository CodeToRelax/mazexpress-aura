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

interface ColumnVisibilityToggleProps {
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  onReset: () => void;
}

const TOGGLEABLE_COLUMNS = [
  { key: 'isn', labelKey: 'shipments.table.columns.isn' },
  { key: 'destination', labelKey: 'shipments.table.columns.destination' },
  { key: 'method', labelKey: 'shipments.table.columns.method' },
  { key: 'status', labelKey: 'shipments.table.columns.status' },
  { key: 'tier', labelKey: 'shipments.table.columns.tier' },
  { key: 'originCountry', labelKey: 'shipments.table.columns.originCountry' },
  { key: 'weight', labelKey: 'shipments.table.columns.weight' },
  { key: 'extraCosts', labelKey: 'shipments.table.columns.extraCosts' },
  { key: 'estimatedArrival', labelKey: 'shipments.table.columns.estimatedArrival' },
];

export function ColumnVisibilityToggle({
  visibleColumns,
  onToggleColumn,
  onReset,
}: ColumnVisibilityToggleProps) {
  const { t } = useTranslation();

  const hiddenCount = TOGGLEABLE_COLUMNS.length - visibleColumns.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">{t('shipments.columns.visibility', { defaultValue: 'Columns' })}</span>
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {t('shipments.columns.hiddenCount', { count: hiddenCount, defaultValue: `${hiddenCount} hidden` })}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card z-50">
        <DropdownMenuLabel>{t('shipments.columns.showHide', { defaultValue: 'Toggle Columns' })}</DropdownMenuLabel>
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
          {t('shipments.columns.resetDefault', { defaultValue: 'Reset to Default' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
