import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogOut, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signOut } from '@/utilities/firebase/authHelpers';
import { useAppDispatch, useAppSelector } from '@/utilities/redux';
import { logout } from '@/screens/auth/auth.slice';
import { appConfig } from '@/app.config';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast.error(t(error));
    } else {
      dispatch(logout());
      toast.success(t('status.success'));
      navigate(appConfig.auth.redirectAfterLogout);
    }
  };
  
  return (
    <div className="glass-background min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t('appName')}
            </h1>
          </div>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="glass-card hover:shadow-glass-hover"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('actions.signOut')}
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-lg p-8 max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/10 mb-6">
            <Package className="h-10 w-10 text-success" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {t('dashboard.welcome')}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {t('status.authenticated')}
          </p>
          
          {user && (
            <div className="glass-card rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
          )}
          
          <p className="text-muted-foreground text-sm">
            {t('dashboard.placeholder')}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
