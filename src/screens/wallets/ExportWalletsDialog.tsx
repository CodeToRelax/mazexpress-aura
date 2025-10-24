import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UserFilters } from '@/types/user';
import { exportUsersToCSV } from '@/utilities/helpers/exportUsersToCSV';
import { toast } from '@/hooks/use-toast';

interface ExportWalletsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: UserFilters;
  totalCount: number;
}

export function ExportWalletsDialog({ open, onOpenChange, filters, totalCount }: ExportWalletsDialogProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportUsersToCSV(filters);
      toast({ title: t('wallets.export.success', { count: totalCount }) });
      onOpenChange(false);
    } catch (error) {
      toast({ title: t('wallets.export.error'), description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsExporting(false);
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
            <DialogTitle>{t('wallets.export.title')}</DialogTitle>
          </div>
          <DialogDescription>{t('wallets.export.description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">Exporting {totalCount} wallet records to CSV</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>Cancel</Button>
          <Button type="button" onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
