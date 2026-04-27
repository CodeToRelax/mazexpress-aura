import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateUserDialog } from '@/screens/users/CreateUserDialog';
import { CreateShipmentDialog } from '@/screens/shipments/CreateShipmentDialog';

export function QuickActionsPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl p-4 sm:p-6"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {t('dashboard.quickActions.title')}
        </h3>
        <div className="flex flex-wrap gap-3 relative z-10">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-w-[140px] h-auto py-3 flex flex-col items-center gap-2"
            onClick={() => setCreateUserOpen(true)}
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-xs">{t('dashboard.quickActions.createAccount')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-w-[140px] h-auto py-3 flex flex-col items-center gap-2"
            onClick={() => setCreateShipmentOpen(true)}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">{t('dashboard.quickActions.createShipment')}</span>
          </Button>
        </div>
      </motion.div>

      <CreateUserDialog 
        open={createUserOpen} 
        onOpenChange={setCreateUserOpen}
        onSuccess={handleSuccess}
      />
      <CreateShipmentDialog 
        open={createShipmentOpen} 
        onOpenChange={setCreateShipmentOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
