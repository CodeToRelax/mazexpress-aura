import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Truck, User as UserIcon, Package, Settings as SettingsIcon, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CityCombobox } from '@/components/domestic/CityCombobox';
import { SenderUserCombobox } from '@/components/domestic/SenderUserCombobox';
import { TierChip } from '@/components/domestic/TierChip';
import { walkInSchema, type WalkInFormValues } from '@/utilities/zod/domestic.schemas';
import { createWalkIn } from '@/utilities/api/domesticShipments.api';
import { lookupRoute, priceForTier } from '@/utilities/api/routes.api';
import { titleCaseCity } from '@/data/domesticCities';
import { toast } from 'sonner';
import type { User } from '@/types/user';
import type { AdminCreateBody, DomesticTier } from '@/types/domestic';

function fmtLyd(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

export default function CreateWalkInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sender, setSender] = useState<User | null>(null);

  const form = useForm<WalkInFormValues>({
    resolver: zodResolver(walkInSchema),
    mode: 'onChange',
    defaultValues: {
      senderUserId: '',
      originCity: '',
      recipient: {
        name: '',
        primaryPhone: '',
        alternatePhone: '',
        city: '',
        address: '',
      },
      description: '',
      itemPrice: 0,
      quantity: 1,
      tier: 'A',
      shippingPrice: undefined,
      options: { fragile: false, storeOnDeliveryFailure: false, insurance: false },
      notes: '',
      status: 'awaiting_shipping',
    },
  });

  const tier = form.watch('tier');
  const originCity = form.watch('originCity');
  const destCity = form.watch('recipient.city');

  // Live route lookup for tiered pricing preview (A/B/C). Tier D is admin-priced.
  const lookupEnabled = tier !== 'D' && !!originCity && !!destCity && originCity !== destCity;
  const { data: route, isLoading: lookupLoading, isError: lookupError } = useQuery({
    queryKey: ['route-lookup', originCity, destCity] as const,
    queryFn: () => lookupRoute(originCity, destCity),
    enabled: lookupEnabled,
  });

  const tierPrice = useMemo(() => {
    if (!route || tier === 'D') return null;
    return priceForTier(route, tier as Exclude<DomesticTier, 'D'>);
  }, [route, tier]);

  const routeMissing = lookupEnabled && !lookupLoading && !route && !lookupError;

  const mutation = useMutation({
    mutationFn: async (values: WalkInFormValues) => {
      const body: AdminCreateBody = {
        senderUserId: values.senderUserId,
        originCity: values.originCity,
        recipient: {
          name: values.recipient.name,
          primaryPhone: values.recipient.primaryPhone,
          alternatePhone: values.recipient.alternatePhone || null,
          city: values.recipient.city,
          address: values.recipient.address,
        },
        description: values.description,
        itemPrice: values.itemPrice,
        quantity: values.quantity,
        tier: values.tier,
        // Only send shippingPrice for tier D (admin-priced).
        shippingPrice: values.tier === 'D' ? values.shippingPrice : undefined,
        options: values.options,
        notes: values.notes || null,
        status: values.status,
      };
      return createWalkIn(body);
    },
    onSuccess: (created) => {
      toast.success(
        t('domestic.admin.shipments.walk-in.success', 'Walk-in shipment {{number}} created.', {
          number: created.shipmentNumber,
        })
      );
      qc.invalidateQueries({ queryKey: ['domestic-shipments'] });
      navigate(`/admin/domestic/shipments/${created._id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create shipment');
    },
  });

  const onSubmit = (values: WalkInFormValues) => {
    if (routeMissing) return;
    mutation.mutate(values);
  };

  return (
    <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/domestic/shipments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('domestic.admin.shipments.walk-in.title', 'New walk-in shipment')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(
              'domestic.admin.shipments.walk-in.subtitle',
              'Create a domestic shipment on behalf of a customer at the counter.'
            )}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1 — Sender */}
        <Card className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {t('domestic.admin.shipments.walk-in.step1', '1. Sender')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('domestic.admin.shipments.walk-in.step1-hint', 'Search the existing customer paying for the shipment.')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('domestic.admin.shipments.walk-in.sender', 'Customer')}</Label>
            <SenderUserCombobox
              value={form.watch('senderUserId')}
              selected={sender}
              onChange={(id, u) => {
                setSender(u);
                form.setValue('senderUserId', id, { shouldValidate: true });
                if (u && (u as unknown as { address?: { city?: string } })?.address?.city) {
                  const c = (u as unknown as { address?: { city?: string } }).address!.city!;
                  if (!form.getValues('originCity')) {
                    form.setValue('originCity', c.toLowerCase(), { shouldValidate: true });
                  }
                }
              }}
            />
            {form.formState.errors.senderUserId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.senderUserId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('domestic.admin.shipments.walk-in.origin', 'Origin city')}</Label>
            <CityCombobox
              value={form.watch('originCity')}
              onChange={(v) => form.setValue('originCity', v, { shouldValidate: true })}
            />
            {form.formState.errors.originCity && (
              <p className="text-sm text-destructive">
                {form.formState.errors.originCity.message}
              </p>
            )}
          </div>
        </Card>

        {/* Step 2 — Recipient & shipment */}
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {t('domestic.admin.shipments.walk-in.step2', '2. Recipient & shipment')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('domestic.admin.shipments.walk-in.step2-hint', 'Where the parcel is going and what it contains.')}
              </p>
            </div>
          </div>

          {/* Recipient block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.recipient-name', 'Recipient name')}</Label>
              <Input {...form.register('recipient.name')} />
              {form.formState.errors.recipient?.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recipient.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.primary-phone', 'Primary phone')}</Label>
              <Input {...form.register('recipient.primaryPhone')} placeholder="+218 91 234 5678" />
              {form.formState.errors.recipient?.primaryPhone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recipient.primaryPhone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                {t('domestic.admin.shipments.walk-in.alt-phone', 'Alternate phone')}{' '}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input {...form.register('recipient.alternatePhone')} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.dest-city', 'Destination city')}</Label>
              <CityCombobox
                value={form.watch('recipient.city')}
                onChange={(v) => form.setValue('recipient.city', v, { shouldValidate: true })}
                excludeCity={originCity}
              />
              {form.formState.errors.recipient?.city && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recipient.city.message}
                </p>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.address', 'Address')}</Label>
              <Textarea rows={2} {...form.register('recipient.address')} />
              {form.formState.errors.recipient?.address && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recipient.address.message}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Shipment block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.description', 'Item description')}</Label>
              <Textarea rows={2} {...form.register('description')} placeholder="e.g. 2 boxes of electronics" />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.quantity', 'Quantity')}</Label>
              <Input type="number" min="1" step="1" {...form.register('quantity', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.item-price', 'Item price (LYD)')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register('itemPrice', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('domestic.admin.shipments.walk-in.tier', 'Tier')}</Label>
              <Controller
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Tier A</SelectItem>
                      <SelectItem value="B">Tier B</SelectItem>
                      <SelectItem value="C">Tier C</SelectItem>
                      <SelectItem value="D">Tier D (manual price)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {tier === 'D' && (
              <div className="md:col-span-2 space-y-2">
                <Label>
                  {t('domestic.admin.shipments.walk-in.shipping-price', 'Shipping price (LYD)')}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('shippingPrice', { valueAsNumber: true })}
                />
                {form.formState.errors.shippingPrice && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.shippingPrice.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t(
                    'domestic.admin.shipments.walk-in.tier-d-hint',
                    'Tier D: shipping price is set manually by the admin.'
                  )}
                </p>
              </div>
            )}

            {/* Live tier price preview */}
            {tier !== 'D' && lookupEnabled && (
              <div className="md:col-span-2">
                {lookupLoading ? (
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('domestic.admin.shipments.walk-in.looking-up', 'Looking up route price…')}
                  </div>
                ) : route && tierPrice !== null ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      <TierChip tier={tier} size="sm" className="mr-2" />
                      {fmtLyd(tierPrice)} LYD ·{' '}
                      {titleCaseCity(originCity)} → {titleCaseCity(destCity)}
                    </span>
                  </div>
                ) : routeMissing ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t(
                        'domestic.admin.shipments.walk-in.no-route',
                        'No route exists for this pair. Create one in Routes first.'
                      )}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        {/* Step 3 — Options & status */}
        <Card className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {t('domestic.admin.shipments.walk-in.step3', '3. Options & initial status')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              control={form.control}
              name="options.fragile"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border cursor-pointer">
                  <span className="text-sm">{t('domestic.admin.shipments.options.fragile', 'Fragile')}</span>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
            <Controller
              control={form.control}
              name="options.storeOnDeliveryFailure"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border cursor-pointer">
                  <span className="text-sm">
                    {t('domestic.admin.shipments.options.store', 'Store on delivery failure')}
                  </span>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
            <Controller
              control={form.control}
              name="options.insurance"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 p-3 rounded-md border border-border cursor-pointer">
                  <span className="text-sm">{t('domestic.admin.shipments.options.insurance', 'Insurance')}</span>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('domestic.admin.shipments.walk-in.initial-status', 'Initial status')}</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  {(['awaiting_approval', 'awaiting_shipping', 'in_transit'] as const).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 p-3 rounded-md border border-border cursor-pointer hover:bg-muted/40"
                    >
                      <RadioGroupItem value={s} />
                      <span className="text-sm">{t(`domestic.status.${s}`, s)}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {form.watch('status') === 'in_transit' && (
              <p className="text-xs text-muted-foreground">
                {t(
                  'domestic.admin.shipments.walk-in.in-transit-hint',
                  'Wallet posting rules will be evaluated when status changes occur.'
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t('domestic.admin.shipments.walk-in.notes', 'Notes')}{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea rows={2} {...form.register('notes')} />
          </div>
        </Card>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/domestic/shipments')}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending || routeMissing}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Package className="h-4 w-4 mr-2" />
            {t('domestic.admin.shipments.walk-in.submit', 'Create shipment')}
          </Button>
        </div>
      </form>
    </div>
  );
}