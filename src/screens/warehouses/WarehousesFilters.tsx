import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { WarehouseStatus, type WarehouseFilters } from '@/types/warehouse';

interface WarehousesFiltersProps {
  filters: WarehouseFilters;
  onFilterChange: (filters: Partial<WarehouseFilters>) => void;
}

export function WarehousesFilters({ filters, onFilterChange }: WarehousesFiltersProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Update filters when debounced search changes
  useEffect(() => {
    onFilterChange({ search: debouncedSearch });
  }, [debouncedSearch]);

  const handleClearFilters = () => {
    setSearchTerm('');
    onFilterChange({
      search: undefined,
      status: undefined,
      city: undefined,
      country: undefined,
    });
  };

  const hasActiveFilters =
    filters.search || filters.status || filters.city || filters.country;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('warehouses.filters.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} size="default">
          <X className="h-4 w-4 mr-2" />
          {t('warehouses.actions.clearFilters')}
        </Button>
      )}
    </div>
  );
}
