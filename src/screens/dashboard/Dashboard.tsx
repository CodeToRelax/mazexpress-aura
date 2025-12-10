import { useTranslation } from 'react-i18next';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { AirShipmentsCard } from '@/components/dashboard/AirShipmentsCard';
import { SeaShipmentsCard } from '@/components/dashboard/SeaShipmentsCard';
import { CustomerGrowthCard } from '@/components/dashboard/CustomerGrowthCard';
import { WalletBalanceCard } from '@/components/dashboard/WalletBalanceCard';
import { InvoicesDueCard } from '@/components/dashboard/InvoicesDueCard';
import { DeliveredPackagesCard } from '@/components/dashboard/DeliveredPackagesCard';
import { ShipmentsComparisonChart } from '@/components/dashboard/ShipmentsComparisonChart';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActionsPanel />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <AirShipmentsCard />
        <SeaShipmentsCard />
        <DeliveredPackagesCard />
        <CustomerGrowthCard />
        <WalletBalanceCard />
        <InvoicesDueCard />
      </div>

      {/* Comparison Chart */}
      <ShipmentsComparisonChart />
    </div>
  );
}
