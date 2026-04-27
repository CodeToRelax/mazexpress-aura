import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
import { deleteRoute } from '@/utilities/api/routes.api';
import { titleCaseCity } from '@/data/domesticCities';
import { toast } from 'sonner';
import type { Route } from '@/types/domestic';

interface Props {
  route: Route | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRouteDialog({ route, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!route) return;
      await deleteRoute(route._id);
    },
    onSuccess: () => {
      toast.success('Route deleted');
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {route ? `${titleCaseCity(route.originCity)} → ${titleCaseCity(route.destinationCity)}` : 'route'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'domestic.admin.routes.delete-confirm',
              'This route will be soft-deleted. Existing shipments are unaffected and you can recreate the same pair afterwards.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}