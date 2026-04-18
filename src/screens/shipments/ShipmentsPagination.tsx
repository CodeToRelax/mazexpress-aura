import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShipmentsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export function ShipmentsPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onLimitChange,
  hasNextPage = true,
  hasPrevPage = false,
}: ShipmentsPaginationProps) {
  const { t } = useTranslation();

  const startIndex = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Compute totalPages from items if backend reports < 1
  const computedTotalPages = Math.max(
    totalPages || 0,
    itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 0,
    1
  );

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < computedTotalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (computedTotalPages <= 1) {
      return [1];
    }

    if (computedTotalPages <= maxVisible) {
      for (let i = 1; i <= computedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(computedTotalPages);
      } else if (currentPage >= computedTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = computedTotalPages - 3; i <= computedTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(computedTotalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between bg-card px-6 py-4 rounded-2xl shadow-sm border relative z-20">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {totalItems > 0
            ? t('shipments.table.showingResults', { 
                from: startIndex, 
                to: endIndex, 
                total: totalItems,
                defaultValue: `Showing ${startIndex} to ${endIndex} of ${totalItems} results`
              })
            : t('shipments.table.noResults', { defaultValue: 'No results' })
          }
        </div>
        
        <Select
          value={String(itemsPerPage)}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="icon"
              onClick={() => onPageChange(page as number)}
              className="cursor-pointer"
            >
              {page}
            </Button>
          )
        ))}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
