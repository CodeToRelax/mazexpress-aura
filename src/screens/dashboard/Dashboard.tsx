import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogOut, Package, Settings } from 'lucide-react';
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10">
              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-foreground">
              {t('appName')}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              size="sm"
              className="glass-card hover:shadow-glass-hover"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="glass-card hover:shadow-glass-hover text-xs sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('actions.signOut')}</span>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        {/* Mobile: Single centered card */}
        <div className="lg:hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-lg p-4 sm:p-6"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-success/10 mb-4">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-success" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {t('dashboard.welcome')}
              </h2>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t('status.authenticated')}
              </p>
            </div>
            
            {user && (
              <div className="space-y-3">
                <div className="glass-card rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-foreground font-medium break-all">{user.email}</p>
                </div>
                
                <div className="glass-card rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <p className="text-sm text-foreground font-medium">Active</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                {t('dashboard.placeholder')}
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Desktop: Multi-column layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Welcome Card - Spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 glass-card rounded-lg p-8"
          >
            <div className="flex items-start gap-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-success/10 flex-shrink-0">
                <Package className="h-10 w-10 text-success" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {t('dashboard.welcome')}
                </h2>
                
                <p className="text-base text-muted-foreground mb-6">
                  {t('status.authenticated')}
                </p>
                
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.placeholder')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* User Info Card - Single column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Account Info</h3>
            
            {user && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-foreground font-medium break-all">{user.email}</p>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <p className="text-sm text-foreground font-medium">Active</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">User ID</p>
                  <p className="text-xs text-foreground font-mono break-all">{user.uid}</p>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Quick Stats - Spans all columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 grid grid-cols-3 gap-4"
          >
            <div className="glass-card rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">0</div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
            
            <div className="glass-card rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">0</div>
              <p className="text-sm text-muted-foreground">Notifications</p>
            </div>
            
            <div className="glass-card rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-success mb-1">100%</div>
              <p className="text-sm text-muted-foreground">System Health</p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
