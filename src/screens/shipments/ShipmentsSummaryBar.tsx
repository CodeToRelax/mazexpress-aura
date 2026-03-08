import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Scale, Box } from 'lucide-react';

interface ShipmentsSummaryBarProps {
  totalWeight: number;
  totalCBM: number;
}

export function ShipmentsSummaryBar({ totalWeight = 0, totalCBM = 0 }: ShipmentsSummaryBarProps) {
  const { t } = useTranslation();

  const summaryCards = [
    {
      icon: Scale,
      label: t('shipments.summary.totalWeight', { defaultValue: 'Total Weight' }),
      value: `${(totalWeight ?? 0).toFixed(2)} kg`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Box,
      label: t('shipments.summary.totalCBM', { defaultValue: 'Total CBM' }),
      value: `${(totalCBM ?? 0).toFixed(3)} m³`,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {summaryCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="glass-card rounded-xl p-4 flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
            <card.icon className={`h-6 w-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-xl font-semibold">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
