import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();
    
    return (
      <div className="relative z-0">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'pr-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent pointer-events-auto z-10"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
