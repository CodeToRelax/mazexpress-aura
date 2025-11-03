import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, X, Barcode as BarcodeIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/shipments/StatusBadge';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import type { IShipment, ShipmentStatus } from '@/types/shipment';
import { useDebounce } from '@/hooks/useDebounce';

interface BarcodeScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BarcodeScanDialog({ open, onOpenChange, onSuccess }: BarcodeScanDialogProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [scannedShipments, setScannedShipments] = useState<IShipment[]>([]);
  const [scannedEsns, setScannedEsns] = useState<Set<string>>(new Set());
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const debouncedBarcode = useDebounce(barcodeInput, 300);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Maintain focus after operations
  useEffect(() => {
    if (open && inputRef.current && !isScanning) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, scannedShipments, isScanning]);

  // Process barcode when debounced
  useEffect(() => {
    if (debouncedBarcode && open) {
      handleBarcodeInput(debouncedBarcode);
      setBarcodeInput('');
    }
  }, [debouncedBarcode]);

  const handleBarcodeInput = async (barcode: string) => {
    const esn = barcode.trim().toUpperCase();
    if (!esn) return;

    // Check for duplicates
    if (scannedEsns.has(esn)) {
      toast({
        title: t('shipments.messages.duplicate'),
        description: `${esn} ${t('shipments.messages.alreadyScanned')}`,
      });
      return;
    }

    try {
      setIsScanning(true);
      const response = await shipmentsApi.trackShipment(esn);
      
      if (response.success && response.data) {
        setScannedEsns(prev => new Set([...prev, esn]));
        setScannedShipments(prev => [...prev, response.data]);
        setSelectedShipmentIds(prev => new Set([...prev, response.data._id]));
        
        toast({
          title: t('shipments.messages.scanned'),
          description: `${esn} ${t('shipments.messages.addedToList')}`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch shipment:', error);
      toast({
        title: t('shipments.messages.error'),
        description: error instanceof Error ? error.message : t('shipments.messages.shipmentNotFound'),
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveShipment = (shipmentId: string) => {
    const shipment = scannedShipments.find(s => s._id === shipmentId);
    if (shipment) {
      setScannedShipments(prev => prev.filter(s => s._id !== shipmentId));
      setScannedEsns(prev => {
        const newSet = new Set(prev);
        newSet.delete(shipment.esn);
        return newSet;
      });
      setSelectedShipmentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(shipmentId);
        return newSet;
      });
    }
  };

  const handleToggleShipment = (shipmentId: string) => {
    setSelectedShipmentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId);
      } else {
        newSet.add(shipmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipmentIds(new Set(scannedShipments.map(s => s._id)));
    } else {
      setSelectedShipmentIds(new Set());
    }
  };

  const handleSave = async () => {
    if (selectedShipmentIds.size === 0) {
      toast({
        title: t('shipments.messages.error'),
        description: t('shipments.messages.selectShipments'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedStatus) {
      toast({
        title: t('shipments.messages.error'),
        description: t('shipments.messages.selectStatus'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      await shipmentsApi.bulkUpdateShipments({
        shipmentsId: Array.from(selectedShipmentIds),
        shipmentStatus: selectedStatus,
      });
      
      toast({
        title: t('shipments.messages.success'),
        description: t('shipments.messages.bulkUpdateSuccess', { count: selectedShipmentIds.size }),
      });
      
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to bulk update:', error);
      toast({
        title: t('shipments.messages.error'),
        description: error instanceof Error ? error.message : t('shipments.messages.bulkUpdateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setScannedShipments([]);
    setScannedEsns(new Set());
    setSelectedShipmentIds(new Set());
    setSelectedStatus('');
    setBarcodeInput('');
    onOpenChange(false);
  };

  const allSelected = scannedShipments.length > 0 && selectedShipmentIds.size === scannedShipments.length;
  const someSelected = selectedShipmentIds.size > 0 && selectedShipmentIds.size < scannedShipments.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            {t('shipments.actions.scanBarcodes')}
          </DialogTitle>
          <DialogDescription>
            {t('shipments.scanDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Hidden Input for Barcode Scanner */}
        <input
          ref={inputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleBarcodeInput(barcodeInput);
              setBarcodeInput('');
            }
          }}
          className="sr-only"
          autoFocus
          placeholder="Scan barcode..."
          aria-label="Barcode scanner input"
        />

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Scanned Shipments List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {scannedShipments.length > 0 && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                    aria-label="Select all shipments"
                  />
                )}
                <span className="text-sm font-medium">
                  {scannedShipments.length === 0
                    ? t('shipments.scanDialog.startScanning')
                    : t('shipments.scanDialog.scannedCount', {
                        scanned: scannedShipments.length,
                        selected: selectedShipmentIds.size,
                      })}
                </span>
              </div>
              {isScanning && (
                <span className="text-sm text-muted-foreground animate-pulse">
                  {t('shipments.scanDialog.scanning')}
                </span>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              {scannedShipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t('shipments.scanDialog.emptyState')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {scannedShipments.map((shipment) => (
                    <div
                      key={shipment._id}
                      className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors border"
                    >
                      <Checkbox
                        checked={selectedShipmentIds.has(shipment._id)}
                        onCheckedChange={() => handleToggleShipment(shipment._id)}
                        aria-label={`Select ${shipment.esn}`}
                      />
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-sm font-medium truncate">{shipment.esn}</span>
                          <span className="text-xs text-muted-foreground truncate">{shipment.csn}</span>
                        </div>
                        <div className="text-sm capitalize text-muted-foreground">
                          {shipment.shipmentDestination}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={shipment.status} />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShipment(shipment._id)}
                        className="shrink-0"
                        aria-label={`Remove ${shipment.esn}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('shipments.fields.status')}
            </label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('shipments.scanDialog.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received at warehouse">{t('shipments.table.status.received_at_warehouse')}</SelectItem>
                <SelectItem value="shipped to destination">{t('shipments.table.status.shipped_to_destination')}</SelectItem>
                <SelectItem value="ready for pick up">{t('shipments.table.status.ready_for_pick_up')}</SelectItem>
                <SelectItem value="in transit">{t('shipments.table.status.in_transit')}</SelectItem>
                <SelectItem value="delivered">{t('shipments.table.status.delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('shipments.table.status.cancelled')}</SelectItem>
                <SelectItem value="returned">{t('shipments.table.status.returned')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedShipmentIds.size === 0 || !selectedStatus || isUpdating}
          >
            {isUpdating ? t('common.saving') : t('shipments.actions.saveUpdates')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
