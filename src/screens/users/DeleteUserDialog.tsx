import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import type { User } from '@/types/user';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserDialog({ user, open, onClose, onConfirm }: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmText === 'Delete') {
      onConfirm();
      setConfirmText('');
    }
  };

  const isValid = confirmText === 'Delete';

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('users.actions.delete')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>
            {user && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            )}
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-foreground">
                Type <span className="font-bold text-destructive">Delete</span> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Delete"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('users.form.cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!isValid}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('users.actions.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
