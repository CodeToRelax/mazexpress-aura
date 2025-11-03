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
  onBulkExport: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
}: BulkActionsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
      <Badge variant="secondary" className="px-3 py-1">
        {selectedCount} {t('invoice.bulk.selected')}
      </Badge>

      <div className="flex items-center gap-2 ml-auto">
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
