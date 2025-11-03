import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, Info, Calendar as CalendarIcon } from 'lucide-react';
import type { ShipmentFilters } from '@/types/shipment';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useACL } from '@/hooks/useACL';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const { accessibleStatuses, adminCountry, isSuperAdmin } = useACL();
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

  // Filter statuses based on ACL
  const allStatuses = [
    'in_transit',
    'ready_for_pick_up',
    'delivered',
    'cancelled',
    'returned',
    'received_at_warehouse',
    'shipped_to_destination'
  ];
  
  const statuses = isSuperAdmin 
    ? allStatuses 
    : allStatuses.filter(status => accessibleStatuses.includes(status));

  // Filter origin countries based on admin country
  const getOriginCountries = () => {
    if (isSuperAdmin) {
      return ['libya', 'turkey', 'china', 'uae'];
    }
    if (adminCountry === 'libya') {
      // Libya admins see forwarding countries
      return ['turkey', 'china', 'uae'];
    }
    // Forwarding country admins see their own country
    return adminCountry ? [adminCountry] : [];
  };

  const methods = ['air', 'sea', 'land'];
  const destinations = ['benghazi', 'tripoli', 'misurata', 'zawiya'];
  const originCountries = getOriginCountries();

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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('shipments.filters.status')}</label>
                {!isSuperAdmin && statuses.length < allStatuses.length && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('acl.onlyAccessibleStatuses', { defaultValue: 'Showing only statuses you can manage' })}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
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
              <label className="text-sm font-medium">{t('shipments.filters.tier')}</label>
              <Select
                value={filters.tier || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('tier', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('shipments.filters.allTiers')}</SelectItem>
                  <SelectItem value="A">{t('shipments.tier.a', { defaultValue: 'Tier A - Standard' })}</SelectItem>
                  <SelectItem value="B">{t('shipments.tier.b', { defaultValue: 'Tier B - Premium' })}</SelectItem>
                  <SelectItem value="C">{t('shipments.tier.c', { defaultValue: 'Tier C - VIP' })}</SelectItem>
                  <SelectItem value="D">{t('shipments.tier.d', { defaultValue: 'Tier D - Enterprise' })}</SelectItem>
                  <SelectItem value="E">{t('shipments.tier.e', { defaultValue: 'Tier E - Ultimate' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.originCountry')}</label>
              <Select
                value={filters.originCountry || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('originCountry', value === 'all' ? undefined : value)
                }
                disabled={originCountries.length === 0}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('shipments.filters.allOriginCountries')}</SelectItem>
                  {originCountries.includes('libya') && (
                    <SelectItem value="libya">{t('shipments.originCountry.libya')}</SelectItem>
                  )}
                  {originCountries.includes('turkey') && (
                    <SelectItem value="turkey">{t('shipments.originCountry.turkey')}</SelectItem>
                  )}
                  {originCountries.includes('china') && (
                    <SelectItem value="china">{t('shipments.originCountry.china')}</SelectItem>
                  )}
                  {originCountries.includes('uae') && (
                    <SelectItem value="uae">{t('shipments.originCountry.uae')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shipments.filters.dateFrom')}</label>
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
              <label className="text-sm font-medium">{t('shipments.filters.dateTo')}</label>
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
