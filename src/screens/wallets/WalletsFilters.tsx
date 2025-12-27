import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, Calendar as CalendarIcon } from 'lucide-react';
import type { UserFilters } from '@/types/user';
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

interface WalletsFiltersProps {
  filters: UserFilters & { balanceFilter?: 'positive' | 'negative' | 'zero' };
  onFiltersChange: (filters: UserFilters & { balanceFilter?: 'positive' | 'negative' | 'zero' }) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function WalletsFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  activeFilterCount 
}: WalletsFiltersProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('wallets.filters.searchPlaceholder')}
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
            {t('wallets.filters.advanced')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('wallets.filters.advanced')}</SheetTitle>
            <SheetDescription>
              Filter wallets by specific criteria
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallets.filters.status')}</label>
              <Select
                value={filters.disabled === undefined ? 'all' : filters.disabled ? 'inactive' : 'active'}
                onValueChange={(value) => 
                  handleFilterChange('disabled', value === 'all' ? undefined : value === 'inactive')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('wallets.filters.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('wallets.table.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('wallets.table.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallets.filters.createdAfter')}</label>
              <Popover>
                <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white dark:bg-card",
                    !filters.createdAfter && "text-muted-foreground"
                  )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.createdAfter ? format(new Date(filters.createdAfter), 'dd/MM/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.createdAfter ? new Date(filters.createdAfter) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleFilterChange('createdAfter', formatDateISO(date));
                      } else {
                        handleFilterChange('createdAfter', undefined);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallets.filters.createdBefore')}</label>
              <Popover>
                <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white dark:bg-card",
                    !filters.createdBefore && "text-muted-foreground"
                  )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.createdBefore ? format(new Date(filters.createdBefore), 'dd/MM/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.createdBefore ? new Date(filters.createdBefore) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleFilterChange('createdBefore', formatDateISO(date));
                      } else {
                        handleFilterChange('createdBefore', undefined);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('wallets.filters.balance')}</label>
              <Select
                value={filters.balanceFilter || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('balanceFilter', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('wallets.filters.allBalances')}</SelectItem>
                  <SelectItem value="positive">{t('wallets.filters.positiveBalance')}</SelectItem>
                  <SelectItem value="negative">{t('wallets.filters.negativeBalance')}</SelectItem>
                  <SelectItem value="zero">{t('wallets.filters.zeroBalance')}</SelectItem>
                </SelectContent>
              </Select>
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
          title={t('wallets.actions.resetFilters')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function ActiveFiltersBadges({ 
  filters, 
  onFiltersChange, 
  activeFilterCount 
}: WalletsFiltersProps) {
  const { t } = useTranslation();

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  if (activeFilterCount === 0) return null;

  const getBalanceFilterLabel = () => {
    switch (filters.balanceFilter) {
      case 'positive': return t('wallets.filters.positiveBalance');
      case 'negative': return t('wallets.filters.negativeBalance');
      case 'zero': return t('wallets.filters.zeroBalance');
      default: return '';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.disabled !== undefined && (
        <Badge variant="secondary" className="gap-1">
          Status: {filters.disabled ? 'Inactive' : 'Active'}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleFilterChange('disabled', undefined)}
          />
        </Badge>
      )}
      {(filters.createdAfter || filters.createdBefore) && (
        <Badge variant="secondary" className="gap-1">
          Date Range
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => {
              onFiltersChange({ 
                ...filters, 
                createdAfter: undefined, 
                createdBefore: undefined 
              });
            }}
          />
        </Badge>
      )}
      {filters.balanceFilter && (
        <Badge variant="secondary" className="gap-1">
          {getBalanceFilterLabel()}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleFilterChange('balanceFilter', undefined)}
          />
        </Badge>
      )}
    </div>
  );
}
