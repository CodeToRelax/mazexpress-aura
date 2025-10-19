import { Wallet as WalletIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatLYDFromCents } from '@/utilities/helpers/currencyHelpers';

interface WalletBalanceProps {
  balance: number;
  currency?: string;
  className?: string;
  showIcon?: boolean;
}

export function WalletBalance({ 
  balance, 
  currency = 'LYD', 
  className = '',
  showIcon = true 
}: WalletBalanceProps) {
  const { t } = useTranslation();

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {showIcon && (
            <div className="rounded-full bg-primary/10 p-3">
              <WalletIcon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {t('wallet.currentBalance')}
            </p>
            <p className="text-2xl font-bold">
              {formatLYDFromCents(balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
