import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  label: string;
  mobileLabel?: string; // Shorter label for mobile
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * Responsive table that transforms into cards on mobile
 * - Mobile: Card-based layout with key information
 * - Tablet: Simplified table with fewer columns
 * - Desktop: Full table with all columns
 */
export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          const visibleColumns = columns.filter(col => !col.hideOnMobile);
          
          return (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'glass-card rounded-lg p-4 space-y-3',
                onRowClick && 'cursor-pointer hover:shadow-glass-hover transition-smooth',
                className
              )}
            >
              {visibleColumns.map((column) => {
                const value = item[column.key];
                const displayValue = column.render ? column.render(value, item) : String(value);
                
                return (
                  <div key={String(column.key)} className="flex justify-between items-start gap-4">
                    <span className="text-xs text-muted-foreground font-medium">
                      {column.mobileLabel || column.label}
                    </span>
                    <span className="text-sm text-foreground text-right">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Tablet: Simplified Table */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <div className="glass-card rounded-lg overflow-hidden min-w-full">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                {columns
                  .filter(col => !col.hideOnTablet)
                  .map((column) => (
                    <th
                      key={String(column.key)}
                      className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider"
                    >
                      {column.mobileLabel || column.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'hover:bg-muted/30 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns
                    .filter(col => !col.hideOnTablet)
                    .map((column) => {
                      const value = item[column.key];
                      const displayValue = column.render ? column.render(value, item) : String(value);
                      
                      return (
                        <td
                          key={String(column.key)}
                          className="px-4 py-3 text-sm text-foreground"
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desktop: Full Table */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="glass-card rounded-lg overflow-hidden min-w-full">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'hover:bg-muted/30 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((column) => {
                    const value = item[column.key];
                    const displayValue = column.render ? column.render(value, item) : String(value);
                    
                    return (
                      <td
                        key={String(column.key)}
                        className="px-6 py-4 text-sm text-foreground"
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
