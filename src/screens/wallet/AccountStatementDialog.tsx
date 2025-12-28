import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
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
import { getWallet, getTransactions, getUserTransactions } from '@/utilities/api/wallet.api';
import { printAccountStatement } from '@/utilities/helpers/printAccountStatement';
import type { Wallet } from '@/types/wallet';

interface AccountStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: Wallet | null;
  userId?: string;
  userName?: string;
}

export function AccountStatementDialog({ open, onOpenChange, wallet: initialWallet, userId, userName }: AccountStatementDialogProps) {
  const { t, i18n } = useTranslation();
  
  const [dateFrom, setDateFrom] = useState<Date>(() => subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(() => new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setDateFrom(subDays(now, 30));
      setDateTo(now);
    }
  }, [open]);
  
  // Fetch wallet if not provided
  const { data: fetchedWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(i18n.language),
    enabled: open && !initialWallet,
  });
  
  const wallet = initialWallet || fetchedWallet;
  
  // Preview query for transaction count
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['statement-preview', userId, dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: () => {
      const filters = {
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        limit: 1,
      };
      return userId 
        ? getUserTransactions(userId, filters, i18n.language)
        : getTransactions(filters, i18n.language);
    },
    enabled: open,
  });
  
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
        const filters = {
          dateFrom: format(dateFrom, 'yyyy-MM-dd'),
          dateTo: format(dateTo, 'yyyy-MM-dd'),
          page,
          limit: 100,
        };
        
        const response = userId 
          ? await getUserTransactions(userId, filters, i18n.language)
          : await getTransactions(filters, i18n.language);
        
        allTransactions.push(...response.transactions);
        hasMore = response.pagination.hasNextPage;
        page++;
      }
      
      // Filter transactions by date range (client-side filtering for accuracy)
      const fromStart = startOfDay(dateFrom);
      const toEnd = endOfDay(dateTo);
      const filteredTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= fromStart && txDate <= toEnd;
      });
      
      // Get user info from wallet or use provided userName
      const walletUserId = typeof wallet.userId === 'object' ? wallet.userId : null;
      
      await printAccountStatement({
        wallet,
        transactions: filteredTransactions,
        dateFrom,
        dateTo,
        customerName: userName || (walletUserId ? `${walletUserId.firstName} ${walletUserId.lastName}` : undefined),
        customerEmail: walletUserId?.email,
        locale: 'ar',
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
          {/* Date range */}
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
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear()}
                    className={cn("p-3 pointer-events-auto")}
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
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    disabled={(date) => date > new Date() || date < dateFrom}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear()}
                    className={cn("p-3 pointer-events-auto")}
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
