import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { ShipmentFilters } from '@/types/shipment';
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

interface ShipmentsFiltersProps {
  filters: ShipmentFilters;
  onFiltersChange: (filters: ShipmentFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function ShipmentsFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  activeFilterCount 
}: ShipmentsFiltersProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync search input when filters are cleared
  useEffect(() => {
    if (filters.search === undefined || filters.search === '') {
      setSearchInput('');
    }
  }, [filters.search]);

  useEffect(() => {
    const trimmedSearch = debouncedSearch.trim();
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: trimmedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof ShipmentFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const statuses = [
    'pending',
    'in transit',
    'ready for pick up',
    'delivered',
    'cancelled',
    'returned',
    'received at warehouse',
    'shipped to destination'
  ];

  const methods = ['air', 'sea', 'land'];
  const destinations = ['benghazi', 'tripoli', 'misurata', 'zawiya'];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('shipments.filters.searchPlaceholder')}
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
            {t('shipments.filters.advanced')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('shipments.filters.advanced')}</SheetTitle>
            <SheetDescription>
              {t('shipments.filters.description')}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.status')}</label>
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
                  <SelectItem value="all">{t('shipments.filters.allStatuses')}</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`shipments.table.status.${status.replace(/ /g, '_')}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.method')}</label>
              <Select
                value={filters.method || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('method', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('shipments.filters.allMethods')}</SelectItem>
                  {methods.map(method => (
                    <SelectItem key={method} value={method}>
                      {t(`shipments.table.method.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.destination')}</label>
              <Select
                value={filters.destination || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('destination', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('shipments.filters.allDestinations')}</SelectItem>
                  {destinations.map(destination => (
                    <SelectItem key={destination} value={destination} className="capitalize">
                      {t(`shipments.filters.destinations.${destination}`, { defaultValue: destination })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.dateFrom')}</label>
              <Input
                type="date"
                value={filters.createdAfter || ''}
                onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.dateTo')}</label>
              <Input
                type="date"
                value={filters.createdBefore || ''}
                onChange={(e) => handleFilterChange('createdBefore', e.target.value)}
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
          title={t('shipments.actions.clearFilters')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
