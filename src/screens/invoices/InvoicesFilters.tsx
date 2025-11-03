import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, Calendar as CalendarIcon } from 'lucide-react';
import type { InvoiceFilters } from '@/types/invoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateISO } from '@/utilities/helpers/dateHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InvoicesFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function InvoicesFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  activeFilterCount 
}: InvoicesFiltersProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof InvoiceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoice #, user name, email, shipping #, notes..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('invoice.filter-advanced')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('invoice.filter-advanced')}</SheetTitle>
            <SheetDescription>
              {t('invoice.filter-description')}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('invoice.filter-status')}</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('status', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('invoice.filter-allStatuses')}</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                  <SelectItem value="VOID">Void</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('invoice.filter-dateFrom')}</label>
              <Popover>
                <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-white dark:bg-card",
                !filters.from && "text-muted-foreground"
              )}
            >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.from ? format(new Date(filters.from), 'dd/MM/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.from ? new Date(filters.from) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleFilterChange('from', formatDateISO(date));
                      } else {
                        handleFilterChange('from', undefined);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('invoice.filter-dateTo')}</label>
              <Popover>
                <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-white dark:bg-card",
                !filters.to && "text-muted-foreground"
              )}
            >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.to ? format(new Date(filters.to), 'dd/MM/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.to ? new Date(filters.to) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleFilterChange('to', formatDateISO(date));
                      } else {
                        handleFilterChange('to', undefined);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {activeFilterCount > 0 && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClearFilters}
          className="shrink-0"
          title={t('invoice.action-resetFilters')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
