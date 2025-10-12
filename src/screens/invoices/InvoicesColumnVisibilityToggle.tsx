import { useTranslation } from 'react-i18next';
import { Columns, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnVisibilityToggleProps {
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  onReset: () => void;
}

const TOGGLEABLE_COLUMNS = [
  { key: 'user', labelKey: 'invoice.table.user' },
  { key: 'issueDate', labelKey: 'invoice.table.issueDate' },
  { key: 'dueDate', labelKey: 'invoice.table.dueDate' },
  { key: 'status', labelKey: 'invoice.table.status' },
  { key: 'netAmount', labelKey: 'invoice.table.netAmount' },
  { key: 'taxAmount', labelKey: 'invoice.table.taxAmount' },
  { key: 'grossAmount', labelKey: 'invoice.table.grossAmount' },
  { key: 'paidAmount', labelKey: 'invoice.table.paidAmount' },
  { key: 'dueAmount', labelKey: 'invoice.table.dueAmount' },
];

export function InvoicesColumnVisibilityToggle({
  visibleColumns,
  onToggleColumn,
  onReset,
}: ColumnVisibilityToggleProps) {
  const { t } = useTranslation();
  
  const hiddenCount = TOGGLEABLE_COLUMNS.filter(col => !visibleColumns.has(col.key)).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 shrink-0">
          <Columns className="h-4 w-4" />
          {t('common.columns')}
          {hiddenCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {hiddenCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background">
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
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('common.resetDefault')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
