import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CityCombobox } from '@/components/domestic/CityCombobox';
import { SenderUserCombobox } from '@/components/domestic/SenderUserCombobox';
import { useDebounce } from '@/hooks/useDebounce';
import type { DomesticCity } from '@/types/domestic';
import type { User } from '@/types/user';

export interface ShipmentsFilterState {
  q: string;
  originCity: DomesticCity | '';
  destinationCity: DomesticCity | '';
  senderUserId: string;
}

interface Props {
  state: ShipmentsFilterState;
  onChange: (next: ShipmentsFilterState) => void;
}

export function ShipmentsFilters({ state, onChange }: Props) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(state.q);
  const debounced = useDebounce(searchInput, 300);
  const [sender, setSender] = useState<User | null>(null);

  useEffect(() => {
    if (debounced !== state.q) {
      onChange({ ...state, q: debounced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const reset = () => {
    setSearchInput('');
    setSender(null);
    onChange({ q: '', originCity: '', destinationCity: '', senderUserId: '' });
  };

  const hasFilters =
    state.q || state.originCity || state.destinationCity || state.senderUserId;

  return (
    <Card className="glass-card p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('domestic.admin.shipments.filters.search', 'Search')}
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t(
                'domestic.admin.shipments.filters.search-placeholder',
                'Shipment number, recipient name, or phone'
              )}
              className="pl-9"
            />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('domestic.admin.shipments.filters.origin', 'Origin')}
          </span>
          <CityCombobox
            value={state.originCity}
            onChange={(v) => onChange({ ...state, originCity: v })}
            placeholder={t('domestic.admin.shipments.filters.all', 'All')}
            allowClear
            onClear={() => onChange({ ...state, originCity: '' })}
          />
        </div>
        <div className="lg:col-span-2 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('domestic.admin.shipments.filters.destination', 'Destination')}
          </span>
          <CityCombobox
            value={state.destinationCity}
            onChange={(v) => onChange({ ...state, destinationCity: v })}
            placeholder={t('domestic.admin.shipments.filters.all', 'All')}
            allowClear
            onClear={() => onChange({ ...state, destinationCity: '' })}
          />
        </div>
        <div className="lg:col-span-3 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('domestic.admin.shipments.filters.sender', 'Sender')}
          </span>
          <SenderUserCombobox
            value={state.senderUserId}
            selected={sender}
            onChange={(id, u) => {
              setSender(u);
              onChange({ ...state, senderUserId: id });
            }}
          />
        </div>
        <div className="lg:col-span-1 flex items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={!hasFilters}
            className="w-full gap-1"
          >
            <X className="h-3.5 w-3.5" />
            {t('domestic.admin.shipments.filters.reset', 'Reset')}
          </Button>
        </div>
      </div>
    </Card>
  );
}