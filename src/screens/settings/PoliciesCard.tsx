import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Loader2, Save, Eye, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { toast } from '@/hooks/use-toast';
import { getPolicies, updatePolicies, type Policies } from '@/utilities/api/policies.api';

const MAX_LEN = 50_000;

const FIELDS: { key: keyof Policies; label: string; description: string }[] = [
  { key: 'policies', label: 'Policies', description: 'General terms & policies. Markdown supported.' },
  { key: 'prohibitedItems', label: 'Prohibited Items', description: 'Items not allowed for shipping. Markdown supported.' },
  { key: 'extra', label: 'Extra', description: 'Additional information. Markdown supported.' },
];

export function PoliciesCard() {
  const [data, setData] = useState<Policies>({ policies: '', prohibitedItems: '', extra: '' });
  const [original, setOriginal] = useState<Policies>({ policies: '', prohibitedItems: '', extra: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'edit' | 'preview'>('edit');

  const load = async () => {
    try {
      setIsLoading(true);
      const p = await getPolicies();
      setData(p);
      setOriginal(p);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to load policies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dirtyKeys = (Object.keys(data) as (keyof Policies)[]).filter(
    (k) => data[k] !== original[k]
  );
  const isDirty = dirtyKeys.length > 0;

  const handleSave = async () => {
    if (!isDirty) return;
    // Build a minimal patch with only changed keys (max 3 canonical fields).
    const patch: Partial<Policies> = {};
    dirtyKeys.forEach((k) => {
      patch[k] = data[k];
    });
    try {
      setIsSaving(true);
      const updated = await updatePolicies(patch);
      setData(updated);
      setOriginal(updated);
      toast({ title: 'Saved', description: 'Policies updated successfully' });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save policies',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ACLGuard
      resource="config"
      action="manage"
      fallback={null}
    >
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Legal & Policies
            </CardTitle>
            <CardDescription>
              Edit the three customer-facing policy blocks. Markdown links like
              <code className="mx-1 px-1 rounded bg-muted">[label](https://…)</code>
              are supported.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === 'edit' ? 'preview' : 'edit')}
            >
              {view === 'edit' ? (
                <>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="policies" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {FIELDS.map((f) => (
                  <TabsTrigger key={f.key} value={f.key}>
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {FIELDS.map((f) => (
                <TabsContent key={f.key} value={f.key} className="mt-4 space-y-2">
                  <Label htmlFor={`field-${f.key}`} className="text-sm">
                    {f.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                  {view === 'edit' ? (
                    <>
                      <Textarea
                        id={`field-${f.key}`}
                        value={data[f.key]}
                        onChange={(e) =>
                          setData((d) => ({ ...d, [f.key]: e.target.value.slice(0, MAX_LEN) }))
                        }
                        rows={16}
                        placeholder={`Enter ${f.label.toLowerCase()}…`}
                        className="font-mono text-sm"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {data[f.key].length.toLocaleString()} / {MAX_LEN.toLocaleString()} chars
                        </span>
                        {data[f.key] !== original[f.key] && (
                          <span className="text-warning">Unsaved changes</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-card p-4 min-h-[200px]">
                      {data[f.key].trim() ? (
                        <ReactMarkdown>{data[f.key]}</ReactMarkdown>
                      ) : (
                        <p className="text-muted-foreground italic">Empty</p>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </ACLGuard>
  );
}
