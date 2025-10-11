import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { TransactionCard } from '@/components/wallet/TransactionCard';
import { DepositDialog } from './DepositDialog';
import { WithdrawDialog } from './WithdrawDialog';
import { getWallet, getTransactions } from '@/utilities/api/wallet.api';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import { useNavigate } from 'react-router-dom';

export default function WalletDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: wallet, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(i18n.language),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => getTransactions({ limit: 5 }, i18n.language),
  });

  if (walletLoading) return <PageLoader />;
  if (walletError) return <InlineError message={walletError.message} />;

  const recentTransactions = transactionsData?.docs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('wallet.dashboard')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setDepositOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('wallet.deposit')}
          </Button>
          <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="gap-2">
            <Minus className="h-4 w-4" />
            {t('wallet.withdraw')}
          </Button>
        </div>
      </div>

      <WalletBalance balance={wallet?.balance || 0} currency={wallet?.currency} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('wallet.recentTransactions')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wallet/transactions')}
            className="gap-1"
          >
            {t('wallet.viewAll')}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('wallet.noTransactions')}</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <TransactionCard key={transaction._id} transaction={transaction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} wallet={wallet || null} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} wallet={wallet || null} />
    </div>
  );
}
