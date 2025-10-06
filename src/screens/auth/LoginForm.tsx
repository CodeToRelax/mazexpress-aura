import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, LoginFormData } from '@/utilities/zod/auth.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/ui/PasswordField';
import { Checkbox } from '@/components/ui/checkbox';
import { InlineError } from '@/components/feedback/InlineError';
import { Spinner } from '@/components/ui/spinner';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isSubmitting: boolean;
  serverError?: string;
}

export function LoginForm({ onSubmit, isSubmitting, serverError }: LoginFormProps) {
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">
          {t('login.email')}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder={t('login.emailPlaceholder')}
            className={`pl-10 h-12 focus-ring ${errors.email ? 'border-destructive' : ''}`}
            disabled={isSubmitting}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <InlineError message={t(errors.email.message || 'errors.email')} />
        )}
      </div>
      
      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground font-medium">
          {t('login.password')}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <PasswordField
            id="password"
            placeholder={t('login.passwordPlaceholder')}
            className={`pl-10 h-12 focus-ring ${errors.password ? 'border-destructive' : ''}`}
            disabled={isSubmitting}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
        {errors.password && (
          <InlineError message={t(errors.password.message || 'errors.required')} />
        )}
      </div>
      
      {/* Remember Me */}
      <div className="flex items-center space-x-2">
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="rememberMe"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <Label
          htmlFor="rememberMe"
          className="text-sm font-normal cursor-pointer"
        >
          {t('login.remember')}
        </Label>
      </div>
      
      {/* Server Error */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <InlineError message={t(serverError)} />
        </motion.div>
      )}
      
      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-primary hover:bg-primary-light shadow-glow-subtle hover:shadow-glow transition-smooth"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner size="sm" className="mr-2" />
            {t('login.submitting')}
          </>
        ) : (
          t('login.submit')
        )}
      </Button>
    </form>
  );
}
