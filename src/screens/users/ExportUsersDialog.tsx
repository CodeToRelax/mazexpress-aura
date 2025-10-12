import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Filter, Users as UsersIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { UserFilters } from '@/types/user';
import { exportUsersToCSV } from '@/utilities/helpers/exportUsersToCSV';
import { toast } from '@/hooks/use-toast';

interface ExportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: UserFilters;
  totalCount: number;
}

export function ExportUsersDialog({
  open,
  onOpenChange,
  filters,
  totalCount,
}: ExportUsersDialogProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportUsersToCSV(filters);
      
      toast({
        title: t('users.export.success', { count: totalCount }),
        description: t('users.export.downloadStarted'),
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('users.export.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const activeFilters = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !['page', 'limit', 'sortBy', 'sortOrder', 'userType'].includes(key)
  );

  const getFilterLabel = (key: string, value: any): string => {
    switch (key) {
      case 'disabled':
        return value === true 
          ? t('users.filters.status') + ': ' + t('users.table.status.disabled')
          : t('users.filters.status') + ': ' + t('users.table.status.active');
      case 'gender':
        return t('users.filters.gender') + ': ' + t(`users.filters.${value}`);
      case 'country':
        return t('users.filters.country') + ': ' + value.charAt(0).toUpperCase() + value.slice(1);
      case 'search':
        return t('users.filters.search') + ': "' + value + '"';
      case 'createdAfter':
        return t('users.filters.createdAfter') + ': ' + new Date(value).toLocaleDateString();
      case 'createdBefore':
        return t('users.filters.createdBefore') + ': ' + new Date(value).toLocaleDateString();
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t('users.export.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('users.export.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t('users.export.estimatedCount')}
              </span>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-foreground">{totalCount}</span>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">
                  {t('users.export.userType')}:
                </span>
                <Badge variant="secondary">
                  {filters.userType === 'customer' 
                    ? t('users.tabs.customers') 
                    : t('users.tabs.admins')}
                </Badge>
              </div>

              {activeFilters.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm mt-3">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">
                      {t('users.export.currentFilters')}:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeFilters.map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {getFilterLabel(key, value)}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {activeFilters.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('users.export.noFilters')}
                </div>
              )}
            </div>
          </div>

          {/* Export Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-sm text-muted-foreground">
              {t('users.export.csvInfo')}
            </p>
          </div>

          {totalCount > 500 && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {t('users.export.largeDatasetWarning', { count: totalCount })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || totalCount === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                {t('users.export.exporting')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t('users.export.confirmExport')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
