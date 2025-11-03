import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types/invoice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: InvoiceStatus) => void;
  onBulkExport: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  onBulkExport,
}: BulkActionsToolbarProps) {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');

  const handleStatusChange = (status: string) => {
    if (status) {
      setSelectedStatus(status as InvoiceStatus);
      onBulkStatusUpdate(status as InvoiceStatus);
      setSelectedStatus('');
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
      <Badge variant="secondary" className="px-3 py-1">
        {selectedCount} {t('invoice.bulk.selected')}
      </Badge>

      <div className="flex items-center gap-2 ml-auto">
        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder={t('invoice.bulk.updateStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">{t('invoice.status.DRAFT')}</SelectItem>
            <SelectItem value="SENT">{t('invoice.status.SENT')}</SelectItem>
            <SelectItem value="PARTIALLY_PAID">{t('invoice.status.PARTIALLY_PAID')}</SelectItem>
            <SelectItem value="PAID">{t('invoice.status.PAID')}</SelectItem>
            <SelectItem value="OVERDUE">{t('invoice.status.OVERDUE')}</SelectItem>
            <SelectItem value="VOID">{t('invoice.status.VOID')}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t('invoice.bulk.export')}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {t('invoice.bulk.delete')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          {t('common.clear')}
        </Button>
      </div>
    </div>
  );
}
