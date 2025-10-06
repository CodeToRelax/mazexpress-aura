import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { AuthLayoutGlass } from '@/components/layout/AuthLayoutGlass';
import { LoginForm } from './LoginForm';
import { LoginFormData } from '@/utilities/zod/auth.schemas';
import { signInWithEmail } from '@/utilities/firebase/authHelpers';
import { useAppDispatch, useAppSelector } from '@/utilities/redux';
import { setSubmitting } from '@/utilities/redux/ui.slice';
import { setUser, setError, clearError } from './auth.slice';
import { appConfig } from '@/app.config';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isSubmitting } = useAppSelector((state) => state.ui);
  const serverError = useAppSelector((state) => state.auth.error);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(appConfig.auth.redirectAfterLogin);
    }
  }, [isAuthenticated, navigate]);
  
  const handleLogin = async (data: LoginFormData) => {
    dispatch(clearError());
    dispatch(setSubmitting(true));
    
    try {
      const { user, error } = await signInWithEmail(data.email, data.password);
      
      if (error) {
        dispatch(setError(error));
        toast.error(t(error));
      } else if (user) {
        dispatch(setUser(user));
        toast.success(t('status.success'));
        navigate(appConfig.auth.redirectAfterLogin);
      }
    } catch (error) {
      const errorMessage = 'errors.auth.unknown';
      dispatch(setError(errorMessage));
      toast.error(t(errorMessage));
    } finally {
      dispatch(setSubmitting(false));
    }
  };
  
  return (
    <AuthLayoutGlass>
      {/* Mobile: Simplified header */}
      <div className="md:hidden space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {t('appName')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('login.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <LoginForm
            onSubmit={handleLogin}
            isSubmitting={isSubmitting}
            serverError={serverError || undefined}
          />
        </motion.div>
      </div>

      {/* Desktop: Card with header */}
      <div className="hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {t('appName')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('login.subtitle')}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-6 text-foreground">
            {t('login.title')}
          </h2>
          
          <LoginForm
            onSubmit={handleLogin}
            isSubmitting={isSubmitting}
            serverError={serverError || undefined}
          />
        </motion.div>
      </div>
    </AuthLayoutGlass>
  );
}
