import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, FileSpreadsheet, Package, CheckSquare } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { IShipment, ShipmentFilters } from '@/types/shipment';
import { exportShipmentsToCSV, exportShipmentsToPDF } from '@/utilities/helpers/shipmentExport';
import { toast } from '@/hooks/use-toast';

interface ExportShipmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ShipmentFilters;
  totalCount: number;
  selectedShipments?: IShipment[];
}

export function ExportShipmentsDialog({ open, onOpenChange, filters, totalCount, selectedShipments = [] }: ExportShipmentsDialogProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'pdf' | null>(null);
  const [exportScope, setExportScope] = useState<'filtered' | 'selected'>(
    selectedShipments.length > 0 ? 'selected' : 'filtered'
  );

  const handleExport = async (type: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      setExportType(type);

      const shipmentsToExport = exportScope === 'selected' ? selectedShipments : undefined;

      const count = type === 'csv'
        ? await exportShipmentsToCSV(filters, shipmentsToExport)
        : await exportShipmentsToPDF(filters, shipmentsToExport);
      toast({ title: t('shipments.export.success', { count }) });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('shipments.export.error', 'Export failed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && value !== '' && !['page', 'limit', 'sort'].includes(key)
  );

  const exportCount = exportScope === 'selected' ? selectedShipments.length : totalCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t('shipments.export.title', 'Export Shipments')}</DialogTitle>
          </div>
          <DialogDescription>{t('shipments.export.description', 'Download shipment data as CSV or PDF file')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export scope selection */}
          {selectedShipments.length > 0 && (
            <RadioGroup value={exportScope} onValueChange={(v) => setExportScope(v as 'filtered' | 'selected')} className="space-y-2">
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExportScope('selected')}>
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium">{t('shipments.export.selectedOnly', 'Selected shipments')}</span>
                    </div>
                    <Badge variant="secondary">{selectedShipments.length}</Badge>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExportScope('filtered')}>
                <RadioGroupItem value="filtered" id="filtered" />
                <Label htmlFor="filtered" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">{t('shipments.export.allFiltered', 'All filtered shipments')}</span>
                    </div>
                    <Badge variant="secondary">{totalCount}</Badge>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          )}

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{t('shipments.export.estimatedCount', 'Estimated records')}</span>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-foreground">{exportCount}</span>
              </div>
            </div>
            {exportScope === 'filtered' && activeFilters.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">{key}: {String(value)}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {exportCount > 500 && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Large dataset ({exportCount} records). Export may take a moment.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => handleExport('pdf')} disabled={isExporting || exportCount === 0} variant="outline" className="gap-2">
            {isExporting && exportType === 'pdf' ? (
              <><div className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />{t('shipments.export.exporting', 'Exporting...')}</>
            ) : (
              <><FileText className="h-4 w-4" />{t('shipments.export.exportPDF', 'Export PDF')}</>
            )}
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={isExporting || exportCount === 0} className="gap-2">
            {isExporting && exportType === 'csv' ? (
              <><div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />{t('shipments.export.exporting', 'Exporting...')}</>
            ) : (
              <><FileSpreadsheet className="h-4 w-4" />{t('shipments.export.confirm', 'Export CSV')}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
