import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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

interface UsersFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function UsersFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  activeFilterCount 
}: UsersFiltersProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const countries = ['libya', 'turkey', 'china', 'uae'];
  const genders = ['male', 'female'];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('users.filters.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('users.filters.advanced')}
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('users.filters.advanced')}</SheetTitle>
              <SheetDescription>
                Filter users by specific criteria
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('users.filters.status')}</label>
                <Select
                  value={filters.disabled === undefined ? 'all' : filters.disabled ? 'disabled' : 'active'}
                  onValueChange={(value) => 
                    handleFilterChange('disabled', value === 'all' ? undefined : value === 'disabled')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('users.filters.allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('users.table.status.active')}</SelectItem>
                    <SelectItem value="disabled">{t('users.table.status.disabled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('users.filters.gender')}</label>
                <Select
                  value={filters.gender || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('gender', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('users.filters.allGenders')}</SelectItem>
                    {genders.map(gender => (
                      <SelectItem key={gender} value={gender}>
                        {t(`users.filters.${gender}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('users.filters.country')}</label>
                <Select
                  value={filters.country || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('country', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('users.filters.allCountries')}</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country} className="capitalize">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('users.filters.createdAfter')}</label>
                <Input
                  type="date"
                  value={filters.createdAfter || ''}
                  onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('users.filters.createdBefore')}</label>
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
            variant="outline" 
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t('users.actions.resetFilters')}
          </Button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.disabled !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.disabled ? 'Disabled' : 'Active'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('disabled', undefined)}
              />
            </Badge>
          )}
          {filters.gender && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Gender: {filters.gender}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('gender', undefined)}
              />
            </Badge>
          )}
          {filters.country && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Country: {filters.country}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('country', undefined)}
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
        </div>
      )}
    </div>
  );
}
