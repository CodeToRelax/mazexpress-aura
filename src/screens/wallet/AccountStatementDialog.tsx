import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { FileText, Calendar, Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getWallet, getTransactions } from '@/utilities/api/wallet.api';
import { generateAccountStatementPDF } from '@/utilities/helpers/accountStatementPDF';
import type { Wallet } from '@/types/wallet';

interface AccountStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: Wallet | null;
}

type PresetPeriod = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export function AccountStatementDialog({ open, onOpenChange, wallet: initialWallet }: AccountStatementDialogProps) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  
  const [dateFrom, setDateFrom] = useState<Date>(subDays(today, 30));
  const [dateTo, setDateTo] = useState<Date>(today);
  const [selectedPreset, setSelectedPreset] = useState<PresetPeriod>('last30days');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch wallet if not provided
  const { data: fetchedWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(i18n.language),
    enabled: open && !initialWallet,
  });
  
  const wallet = initialWallet || fetchedWallet;
  
  // Preview query for transaction count
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['statement-preview', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: () => getTransactions({
      dateFrom: format(dateFrom, 'yyyy-MM-dd'),
      dateTo: format(dateTo, 'yyyy-MM-dd'),
      limit: 1,
    }, i18n.language),
    enabled: open,
  });
  
  const handlePresetChange = (preset: PresetPeriod) => {
    setSelectedPreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'last7days':
        setDateFrom(subDays(now, 7));
        setDateTo(now);
        break;
      case 'last30days':
        setDateFrom(subDays(now, 30));
        setDateTo(now);
        break;
      case 'thisMonth':
        setDateFrom(startOfMonth(now));
        setDateTo(endOfMonth(now));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateFrom(startOfMonth(lastMonth));
        setDateTo(endOfMonth(lastMonth));
        break;
      case 'thisYear':
        setDateFrom(startOfYear(now));
        setDateTo(now);
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };
  
  const handleDateFromChange = (date: Date | undefined) => {
    if (date) {
      setDateFrom(date);
      setSelectedPreset('custom');
    }
  };
  
  const handleDateToChange = (date: Date | undefined) => {
    if (date) {
      setDateTo(date);
      setSelectedPreset('custom');
    }
  };
  
  const handleGeneratePDF = async () => {
    if (!wallet) {
      toast({
        title: t('wallet.statement.noWallet'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Fetch all transactions for the period
      const allTransactions = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await getTransactions({
          dateFrom: format(dateFrom, 'yyyy-MM-dd'),
          dateTo: format(dateTo, 'yyyy-MM-dd'),
          page,
          limit: 100,
        }, i18n.language);
        
        allTransactions.push(...response.transactions);
        hasMore = response.pagination.hasNextPage;
        page++;
      }
      
      // Get user info from wallet
      const userId = typeof wallet.userId === 'object' ? wallet.userId : null;
      
      await generateAccountStatementPDF({
        wallet,
        transactions: allTransactions,
        dateFrom,
        dateTo,
        customerName: userId ? `${userId.firstName} ${userId.lastName}` : undefined,
        customerEmail: userId?.email,
      });
      
      toast({
        title: t('wallet.statement.success'),
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to generate statement:', error);
      toast({
        title: t('wallet.statement.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const presets: { key: PresetPeriod; label: string }[] = [
    { key: 'last7days', label: t('wallet.statement.presets.last7days') },
    { key: 'last30days', label: t('wallet.statement.presets.last30days') },
    { key: 'thisMonth', label: t('wallet.statement.presets.thisMonth') },
    { key: 'lastMonth', label: t('wallet.statement.presets.lastMonth') },
    { key: 'thisYear', label: t('wallet.statement.presets.thisYear') },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('wallet.statement.title')}
          </DialogTitle>
          <DialogDescription>
            {t('wallet.statement.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quick presets */}
          <div className="space-y-2">
            <Label>{t('wallet.statement.quickSelect')}</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  variant={selectedPreset === preset.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetChange(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Custom date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('wallet.statement.dateFrom')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : t('wallet.statement.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={handleDateFromChange}
                    disabled={(date) => date > today}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>{t('wallet.statement.dateTo')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM/yyyy') : t('wallet.statement.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={handleDateToChange}
                    disabled={(date) => date > today || date < dateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Preview info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('wallet.statement.period')}</span>
              <span className="font-medium">
                {format(dateFrom, 'dd/MM/yyyy')} - {format(dateTo, 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">{t('wallet.statement.transactionCount')}</span>
              <span className="font-medium">
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  previewData?.pagination.totalItems || 0
                )}
              </span>
            </div>
            {wallet && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">{t('wallet.statement.currentBalance')}</span>
                <span className="font-medium text-primary">
                  {wallet.balance.toLocaleString()} {wallet.currency}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleGeneratePDF}
            disabled={isGenerating || !wallet}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t('wallet.statement.generate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
