import { useEffect, useMemo, useState } from 'react';
import { Coins, Loader2, Plus, Save, Trash2, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { toast } from '@/hooks/use-toast';
import {
  getItemCalculatorRates,
  updateItemCalculatorRates,
  convertItemAmount,
} from '@/utilities/api/config.api';

interface RateRow {
  currency: string;
  rate: string;
}

export function ItemCalculatorCard() {
  const [rows, setRows] = useState<RateRow[]>([]);
  const [original, setOriginal] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Convert widget
  const [convertAmount, setConvertAmount] = useState('');
  const [convertCurrency, setConvertCurrency] = useState('');
  const [convertResult, setConvertResult] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await getItemCalculatorRates();
      setOriginal(data);
      setRows(
        Object.entries(data).map(([currency, rate]) => ({
          currency,
          rate: String(rate),
        }))
      );
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to load FX rates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isDirty = useMemo(() => {
    if (rows.length !== Object.keys(original).length) return true;
    return rows.some((r) => {
      const code = r.currency.trim().toUpperCase();
      if (!code) return true;
      const num = Number(r.rate);
      return !(code in original) || original[code] !== num;
    });
  }, [rows, original]);

  const handleSave = async () => {
    // Validate + collect
    const patch: Record<string, number> = {};
    for (const r of rows) {
      const code = r.currency.trim().toUpperCase();
      const num = Number(r.rate);
      if (!code) {
        toast({ title: 'Invalid', description: 'Currency code cannot be empty', variant: 'destructive' });
        return;
      }
      if (!Number.isFinite(num) || num <= 0) {
        toast({ title: 'Invalid', description: `Rate for ${code} must be > 0`, variant: 'destructive' });
        return;
      }
      patch[code] = num;
    }
    try {
      setIsSaving(true);
      const updated = await updateItemCalculatorRates(patch);
      setOriginal(updated);
      setRows(Object.entries(updated).map(([c, r]) => ({ currency: c, rate: String(r) })));
      toast({ title: 'Saved', description: 'FX rates updated' });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvert = async () => {
    const amount = Number(convertAmount);
    const currency = convertCurrency.trim().toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0 || !currency) {
      toast({ title: 'Invalid', description: 'Enter amount and currency', variant: 'destructive' });
      return;
    }
    try {
      setIsConverting(true);
      const result = await convertItemAmount({ amount, currency });
      setConvertResult(result);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Conversion failed',
        variant: 'destructive',
      });
      setConvertResult(null);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <ACLGuard resource="config" action="manage" fallback={null}>
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Item Cost Calculator (FX → LYD)
            </CardTitle>
            <CardDescription>
              One LYD per 1 unit of the listed currency. Codes are stored uppercase.
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {rows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No rates configured.</p>
                )}
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Currency</Label>
                      <Input
                        value={row.currency}
                        onChange={(e) =>
                          setRows((rs) =>
                            rs.map((r, i) => (i === idx ? { ...r, currency: e.target.value.toUpperCase() } : r))
                          )
                        }
                        placeholder="USD"
                        maxLength={6}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rate (LYD per 1 unit)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={row.rate}
                        onChange={(e) =>
                          setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, rate: e.target.value } : r)))
                        }
                        placeholder="0.0000"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRows((rs) => rs.filter((_, i) => i !== idx))}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRows((rs) => [...rs, { currency: '', rate: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add currency
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">Quick convert</h4>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Currency</Label>
                    <Input
                      value={convertCurrency}
                      onChange={(e) => setConvertCurrency(e.target.value.toUpperCase())}
                      placeholder="USD"
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={handleConvert} disabled={isConverting}>
                    {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convert'}
                  </Button>
                </div>
                {convertResult !== null && (
                  <div className="p-3 rounded-lg bg-primary/10 text-sm">
                    <span className="text-muted-foreground">Result: </span>
                    <span className="font-semibold text-primary">
                      {convertResult.toLocaleString(undefined, { maximumFractionDigits: 4 })} LYD
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ACLGuard>
  );
}
