import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('nav.users')}
            </h1>
            <p className="text-muted-foreground">
              {t('users.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-2xl p-8"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center">
            <UsersIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('users.empty.title')}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('users.empty.description')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
