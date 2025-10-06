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
  { key: 'email', labelKey: 'users.table.columns.email' },
  { key: 'phone', labelKey: 'users.table.columns.phone' },
  { key: 'role', labelKey: 'users.table.columns.role' },
  { key: 'status', labelKey: 'users.table.columns.status' },
  { key: 'country', labelKey: 'users.table.columns.country' },
  { key: 'joined', labelKey: 'users.table.columns.joined' },
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
          <span className="hidden sm:inline">{t('users.columns.visibility')}</span>
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {t('users.columns.hiddenCount', { count: hiddenCount })}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card z-50">
        <DropdownMenuLabel>{t('users.columns.showHide')}</DropdownMenuLabel>
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
          {t('users.columns.resetDefault')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
