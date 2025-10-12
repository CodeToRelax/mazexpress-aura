import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { TransactionFilters } from '@/types/wallet';
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

interface TransactionsFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function TransactionsFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  activeFilterCount 
}: TransactionsFiltersProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch]);

  // Sync search input with filters when filters are cleared
  useEffect(() => {
    if (!filters.search && searchInput) {
      setSearchInput('');
    }
  }, [filters.search]);

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('wallet.filters.searchPlaceholder')}
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
            {t('wallet.filters.advanced')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('wallet.filters.advanced')}</SheetTitle>
            <SheetDescription>
              {t('wallet.filters.description')}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallet.filters.type')}</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('type', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('wallet.filters.allTypes')}</SelectItem>
                  <SelectItem value="deposit">{t('wallet.transaction.type.deposit')}</SelectItem>
                  <SelectItem value="withdrawal">{t('wallet.transaction.type.withdrawal')}</SelectItem>
                  <SelectItem value="deduction">{t('wallet.transaction.type.deduction')}</SelectItem>
                  <SelectItem value="refund">{t('wallet.transaction.type.refund')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallet.filters.status')}</label>
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
                  <SelectItem value="all">{t('wallet.filters.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('wallet.transaction.status.pending')}</SelectItem>
                  <SelectItem value="completed">{t('wallet.transaction.status.completed')}</SelectItem>
                  <SelectItem value="failed">{t('wallet.transaction.status.failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallet.filters.dateFrom')}</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallet.filters.dateTo')}</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
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
          title={t('wallet.actions.resetFilters')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
