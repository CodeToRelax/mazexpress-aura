import { useTranslation } from 'react-i18next';
import { Warehouse, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WarehouseStatus, type Warehouse as WarehouseType } from '@/types/warehouse';

interface WarehousesStatsBarProps {
  warehouses: WarehouseType[];
}

export function WarehousesStatsBar({ warehouses }: WarehousesStatsBarProps) {
  const { t } = useTranslation();

  const stats = {
    total: warehouses.length,
    open: warehouses.filter((w) => w.status === WarehouseStatus.OPEN).length,
    closed: warehouses.filter((w) => w.status === WarehouseStatus.CLOSED).length,
  };

  const statItems = [
    {
      label: t('warehouses.stats.total'),
      value: stats.total,
      icon: Warehouse,
      color: 'text-primary',
    },
    {
      label: t('warehouses.stats.open'),
      value: stats.open,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: t('warehouses.stats.closed'),
      value: stats.closed,
      icon: XCircle,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
