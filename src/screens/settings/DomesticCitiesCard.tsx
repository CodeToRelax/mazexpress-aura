import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, Save, MapPin, ChevronDown, Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { getDomesticCities, updateDomesticCity, TiersConfig } from '@/utilities/api/config.api';
import { AddCityDialog } from './AddCityDialog';
import { DeleteCityDialog } from './DeleteCityDialog';

const tiersSchema = z.object({
  A: z.coerce.number().min(0, 'Must be at least 0'),
  B: z.coerce.number().min(0, 'Must be at least 0'),
  C: z.coerce.number().min(0, 'Must be at least 0'),
  D: z.coerce.number().min(0, 'Must be at least 0'),
  E: z.coerce.number().min(0, 'Must be at least 0'),
});

type TiersFormData = z.infer<typeof tiersSchema>;

interface DomesticCitiesCardProps {
  onUpdate?: () => void;
}

function formatCityName(city: string): string {
  return city
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface CityTiersFormProps {
  city: string;
  tiers: TiersConfig;
  onSave: () => void;
  canDelete: boolean;
  onDeleteClick: () => void;
}

function CityTiersForm({ city, tiers, onSave, canDelete, onDeleteClick }: CityTiersFormProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TiersFormData>({
    resolver: zodResolver(tiersSchema),
    defaultValues: tiers,
  });

  useEffect(() => {
    form.reset(tiers);
  }, [tiers, form]);

  const onSubmit = async (data: TiersFormData) => {
    setIsSaving(true);
    try {
      await updateDomesticCity(city, data);
      toast.success(t('common.success'), {
        description: t('settings.domesticCities.cityUpdated', { city: formatCityName(city) }),
      });
      onSave();
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticCities.updateFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tierLabels = ['A', 'B', 'C', 'D', 'E'] as const;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {tierLabels.map((tier) => (
          <div key={tier} className="space-y-1.5">
            <Label htmlFor={`${city}-tier-${tier}`} className="text-xs font-medium">
              {t('settings.domesticCities.tier')} {tier}
            </Label>
            <Input
              id={`${city}-tier-${tier}`}
              type="number"
              step="0.01"
              min="0"
              {...form.register(tier)}
              className="h-9"
            />
            {form.formState.errors[tier] && (
              <p className="text-xs text-destructive">{form.formState.errors[tier]?.message}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDeleteClick}
          disabled={!canDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {t('common.delete')}
        </Button>
        <Button 
          type="submit" 
          size="sm" 
          disabled={isSaving || !form.formState.isDirty}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export function DomesticCitiesCard({ onUpdate }: DomesticCitiesCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [cities, setCities] = useState<Record<string, TiersConfig>>({});
  const [cityList, setCityList] = useState<string[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteCity, setDeleteCity] = useState<string | null>(null);

  const fetchCities = async () => {
    try {
      const data = await getDomesticCities();
      setCities(data.domestic);
      setCityList(data.cities);
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticCities.fetchFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleCityAdded = () => {
    fetchCities();
    setAddDialogOpen(false);
    onUpdate?.();
  };

  const handleCityDeleted = () => {
    fetchCities();
    setDeleteCity(null);
    onUpdate?.();
  };

  const handleCityUpdated = () => {
    fetchCities();
    onUpdate?.();
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('settings.domesticCities.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('settings.domesticCities.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.domesticCities.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('settings.domesticCities.addCity')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cityList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.domesticCities.noCities')}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {cityList.map((city) => (
                <AccordionItem key={city} value={city}>
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium">{formatCityName(city)}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-2">
                    <CityTiersForm
                      city={city}
                      tiers={cities[city]}
                      onSave={handleCityUpdated}
                      canDelete={cityList.length > 1}
                      onDeleteClick={() => setDeleteCity(city)}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <AddCityDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleCityAdded}
        existingCities={cityList}
      />

      <DeleteCityDialog
        open={!!deleteCity}
        onOpenChange={(open) => !open && setDeleteCity(null)}
        city={deleteCity || ''}
        onSuccess={handleCityDeleted}
      />
    </>
  );
}
