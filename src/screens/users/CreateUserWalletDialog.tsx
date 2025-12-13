import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Wallet } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { createWallet } from '@/utilities/api/wallet.api';
import { toast } from '@/hooks/use-toast';

interface CreateUserWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function CreateUserWalletDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: CreateUserWalletDialogProps) {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createWallet({ userId, currency: 'LYD' });
      toast({
        title: t('common.success'),
        description: `Wallet created successfully for ${userName}`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to create wallet',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Create Wallet
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to create a wallet for <strong>{userName}</strong>?
            <br /><br />
            A new wallet with <strong>LYD</strong> currency will be created with an initial balance of 0.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Wallet
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
