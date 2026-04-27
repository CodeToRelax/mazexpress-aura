import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomesticStatusChip } from '@/components/domestic/DomesticStatusChip';
import { changeStatus } from '@/utilities/api/domesticShipments.api';
import {
  ALLOWED_TRANSITIONS,
  InvalidTransitionError,
  type DomesticShipment,
  type DomesticStatus,
} from '@/types/domestic';
import { toast } from 'sonner';

interface Props {
  shipment: DomesticShipment;
  trigger: React.ReactNode;
}

function isWalletDebitOnTransit(s: DomesticShipment) {
  return (
    s.creationSource === 'app' &&
    s.shippingPaidBy === 'sender' &&
    s.shippingPrice > 0 &&
    !s.shippingChargedAt
  );
}
function isWalletCreditOnDelivered(s: DomesticShipment) {
  return s.itemPaidBy === 'receiver' && s.itemPrice > 0 && !s.itemCreditedAt;
}

export function ChangeStatusPopover({ shipment, trigger }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DomesticStatus | null>(null);
  const [note, setNote] = useState('');
  const [allowedOverride, setAllowedOverride] = useState<DomesticStatus[] | null>(null);

  const allowed = allowedOverride ?? ALLOWED_TRANSITIONS[shipment.status];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      return changeStatus(shipment._id, { toStatus: selected, note: note || undefined });
    },
    onSuccess: () => {
      toast.success(t('domestic.admin.detail.status-changed', 'Status updated.'));
      qc.invalidateQueries({ queryKey: ['domestic-shipment', shipment._id] });
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      qc.invalidateQueries({ queryKey: ['domestic-shipment-transactions', { id: shipment._id }] });
      setOpen(false);
      setSelected(null);
      setNote('');
      setAllowedOverride(null);
    },
    onError: (err) => {
      if (err instanceof InvalidTransitionError) {
        setAllowedOverride(err.details.allowed);
        toast.error(
          t('domestic.admin.detail.invalid-transition', 'That status change is no longer allowed.')
        );
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    },
  });

  if (allowed.length === 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-72 bg-popover" align="end">
          <p className="text-sm text-muted-foreground">
            {t(
              'domestic.admin.detail.no-transitions',
              'No further status transitions are allowed.'
            )}
          </p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelected(null); setNote(''); }}}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 bg-popover" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {t('domestic.admin.detail.change-from', 'From')}
            </p>
            <DomesticStatusChip status={shipment.status} size="sm" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('domestic.admin.detail.change-to', 'Move to')}
            </p>
            {allowed.map((s) => {
              const showDebitHint = s === 'in_transit' && isWalletDebitOnTransit(shipment);
              const showCreditHint = s === 'delivered' && isWalletCreditOnDelivered(shipment);
              const active = selected === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelected(s)}
                  className={`w-full text-start p-2 rounded-md border transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <DomesticStatusChip status={s} size="sm" />
                  </div>
                  {(showDebitHint || showCreditHint) && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      {showDebitHint &&
                        t(
                          'domestic.admin.detail.hint-debit',
                          'Will debit the sender wallet for the shipping price.'
                        )}
                      {showCreditHint &&
                        t(
                          'domestic.admin.detail.hint-credit',
                          'Will credit the sender wallet for the item price collected from the receiver.'
                        )}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t('domestic.admin.detail.note', 'Note (optional, max 500)')}
              </p>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder={t('domestic.admin.detail.note-placeholder', 'Add a short note for the audit log…')}
              />
            </div>
          )}

          {allowedOverride && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">
                {t('domestic.admin.detail.refreshed', 'Allowed transitions refreshed.')}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              disabled={!selected || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              {t('domestic.admin.detail.confirm', 'Confirm change')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}