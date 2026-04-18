import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Plus, Trash2, Save, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import {
  getAirInternationalRates,
  updateAirInternationalRates,
  type AirInternationalRateBracket,
  type AirInternationalRates,
  type AirInternationalCountryKey,
} from '@/utilities/api/config.api';

const COUNTRIES: { key: AirInternationalCountryKey; label: string }[] = [
  { key: 'turkey', label: 'Turkey' },
  { key: 'china', label: 'China' },
  { key: 'uae', label: 'UAE' },
];

const DEFAULT_BRACKET: AirInternationalRateBracket = {
  minKg: 0,
  ratePerKgUsd: 0,
};

type DraftBracket = {
  minKg: string;
  maxKg: string; // empty string = ∞
  ratePerKgUsd: string;
};

function toDraft(b: AirInternationalRateBracket): DraftBracket {
  return {
    minKg: String(b.minKg),
    maxKg: b.maxKg === undefined ? '' : String(b.maxKg),
    ratePerKgUsd: String(b.ratePerKgUsd),
  };
}

function fromDraft(d: DraftBracket): AirInternationalRateBracket {
  const bracket: AirInternationalRateBracket = {
    minKg: Number(d.minKg),
    ratePerKgUsd: Number(d.ratePerKgUsd),
  };
  if (d.maxKg.trim() !== '') {
    bracket.maxKg = Number(d.maxKg);
  }
  return bracket;
}

function validateBrackets(brackets: DraftBracket[]): string | null {
  if (brackets.length === 0) return 'At least one bracket is required';
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const min = Number(b.minKg);
    const rate = Number(b.ratePerKgUsd);
    if (Number.isNaN(min) || Number.isNaN(rate)) return `Bracket ${i + 1}: invalid number`;
    if (rate <= 0) return `Bracket ${i + 1}: rate must be > 0`;
    const isLast = i === brackets.length - 1;
    if (!isLast && b.maxKg.trim() === '') return `Bracket ${i + 1}: only the last bracket can omit max kg`;
    if (b.maxKg.trim() !== '') {
      const max = Number(b.maxKg);
      if (Number.isNaN(max)) return `Bracket ${i + 1}: invalid max kg`;
      if (max <= min) return `Bracket ${i + 1}: max must be greater than min`;
    }
  }
  if (Number(brackets[0].minKg) !== 0) return 'First bracket must start at 0 kg';
  for (let i = 1; i < brackets.length; i++) {
    const prevMax = Number(brackets[i - 1].maxKg);
    const currMin = Number(brackets[i].minKg);
    if (prevMax !== currMin) return `Bracket ${i + 1}: min (${currMin}) must equal previous max (${prevMax})`;
  }
  return null;
}

export function AirInternationalRatesCard() {
  const [rates, setRates] = useState<Record<AirInternationalCountryKey, DraftBracket[]>>({
    turkey: [toDraft(DEFAULT_BRACKET)],
    china: [toDraft(DEFAULT_BRACKET)],
    uae: [toDraft(DEFAULT_BRACKET)],
  });
  const [original, setOriginal] = useState<Record<AirInternationalCountryKey, DraftBracket[]> | null>(null);
  const [activeCountry, setActiveCountry] = useState<AirInternationalCountryKey>('turkey');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const data = await getAirInternationalRates();
      const seeded: Record<AirInternationalCountryKey, DraftBracket[]> = {
        turkey: (data.turkey?.length ? data.turkey : [DEFAULT_BRACKET]).map(toDraft),
        china: (data.china?.length ? data.china : [DEFAULT_BRACKET]).map(toDraft),
        uae: (data.uae?.length ? data.uae : [DEFAULT_BRACKET]).map(toDraft),
      };
      setRates(seeded);
      setOriginal(JSON.parse(JSON.stringify(seeded)));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load air rates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const updateBracket = (country: AirInternationalCountryKey, idx: number, field: keyof DraftBracket, value: string) => {
    setRates(prev => {
      const next = { ...prev };
      const list = [...next[country]];
      list[idx] = { ...list[idx], [field]: value };
      next[country] = list;
      return next;
    });
  };

  const addBracket = (country: AirInternationalCountryKey) => {
    setRates(prev => {
      const list = [...prev[country]];
      const last = list[list.length - 1];
      // If last bracket has no maxKg, set it to its minKg + 1 to make the new bracket contiguous
      if (last && last.maxKg.trim() === '') {
        const lastMin = Number(last.minKg) || 0;
        list[list.length - 1] = { ...last, maxKg: String(lastMin + 1) };
      }
      const newMin = list[list.length - 1].maxKg || '0';
      list.push({ minKg: newMin, maxKg: '', ratePerKgUsd: '0' });
      return { ...prev, [country]: list };
    });
  };

  const removeBracket = (country: AirInternationalCountryKey, idx: number) => {
    setRates(prev => {
      const list = prev[country].filter((_, i) => i !== idx);
      if (list.length === 0) list.push(toDraft(DEFAULT_BRACKET));
      // Ensure last bracket has no maxKg (∞)
      list[list.length - 1] = { ...list[list.length - 1], maxKg: '' };
      // Ensure first starts at 0
      list[0] = { ...list[0], minKg: '0' };
      return { ...prev, [country]: list };
    });
  };

  const validationError = validateBrackets(rates[activeCountry]);

  const handleSave = async () => {
    // Validate all countries
    for (const c of COUNTRIES) {
      const err = validateBrackets(rates[c.key]);
      if (err) {
        toast({
          title: `${c.label}: validation failed`,
          description: err,
          variant: 'destructive',
        });
        setActiveCountry(c.key);
        return;
      }
    }

    setIsSaving(true);
    try {
      const body: AirInternationalRates = {
        turkey: rates.turkey.map(fromDraft),
        china: rates.china.map(fromDraft),
        uae: rates.uae.map(fromDraft),
      };
      await updateAirInternationalRates(body);
      toast({ title: 'Success', description: 'Air international rates saved' });
      setOriginal(JSON.parse(JSON.stringify(rates)));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save rates',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (original) setRates(JSON.parse(JSON.stringify(original)));
  };

  const isDirty = original ? JSON.stringify(original) !== JSON.stringify(rates) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Plane className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Air International Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Weight-based USD/kg brackets per origin country
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving || isLoading || !isDirty} size="sm">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeCountry} onValueChange={(v) => setActiveCountry(v as AirInternationalCountryKey)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {COUNTRIES.map(c => (
                <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>
              ))}
            </TabsList>

            {COUNTRIES.map(c => (
              <TabsContent key={c.key} value={c.key} className="mt-0 space-y-4">
                {validationError && c.key === activeCountry && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                <div className="rounded-lg border bg-muted/20">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <div>Min kg (incl.)</div>
                    <div>Max kg (excl.)</div>
                    <div>USD / kg</div>
                    <div className="w-9" />
                  </div>

                  <div className="divide-y">
                    {rates[c.key].map((bracket, idx) => {
                      const isLast = idx === rates[c.key].length - 1;
                      const isFirst = idx === 0;
                      return (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={bracket.minKg}
                            disabled={isFirst}
                            onChange={(e) => updateBracket(c.key, idx, 'minKg', e.target.value)}
                            className="bg-background"
                          />
                          {isLast ? (
                            <div className="flex items-center justify-center text-muted-foreground text-sm font-medium">
                              ∞ (unlimited)
                            </div>
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              value={bracket.maxKg}
                              onChange={(e) => updateBracket(c.key, idx, 'maxKg', e.target.value)}
                              className="bg-background"
                            />
                          )}
                          <Input
                            type="number"
                            step="0.01"
                            value={bracket.ratePerKgUsd}
                            onChange={(e) => updateBracket(c.key, idx, 'ratePerKgUsd', e.target.value)}
                            className="bg-background"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBracket(c.key, idx)}
                            disabled={rates[c.key].length === 1}
                            className="h-9 w-9 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 py-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBracket(c.key)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add bracket
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Brackets must be contiguous (next min equals previous max). Only the last bracket can omit max (treated as unlimited).
                </p>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </Card>
    </motion.div>
  );
}
