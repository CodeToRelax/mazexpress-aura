import { useTranslation } from 'react-i18next';
import { XCircle, CheckCircle2 } from 'lucide-react';
import type { User } from '@/types/user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeactivateWalletDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateWalletDialog({ user, open, onClose, onConfirm }: DeactivateWalletDialogProps) {
  const { t } = useTranslation();
  
  if (!user) return null;

  const isActivating = user.disabled;
  const Icon = isActivating ? CheckCircle2 : XCircle;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActivating ? 'bg-primary/10' : 'bg-destructive/10'
            }`}>
              <Icon className={`h-6 w-6 ${isActivating ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <AlertDialogTitle className="text-xl">
              {isActivating ? t('wallets.actions.activate') : t('wallets.actions.deactivate')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              {isActivating 
                ? 'Are you sure you want to activate this wallet? The user will regain access to their wallet.'
                : 'Are you sure you want to deactivate this wallet? The user will lose access to their wallet.'}
            </p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('wallets.form.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isActivating ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
          >
            {isActivating ? t('wallets.actions.activate') : t('wallets.actions.deactivate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
