import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPolicies, type Policies } from '@/utilities/api/policies.api';

const SECTIONS: { key: keyof Policies; label: string }[] = [
  { key: 'policies', label: 'Policies' },
  { key: 'prohibitedItems', label: 'Prohibited Items' },
  { key: 'extra', label: 'Extra' },
];

export default function PoliciesPage() {
  const [data, setData] = useState<Policies | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolicies()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  return (
    <div className="glass-background min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Legal & Policies</h1>
          <p className="text-muted-foreground">Terms, prohibited items, and additional information</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Document</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive">{error}</p>}
            {!data && !error && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {data && (
              <Tabs defaultValue="policies" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {SECTIONS.map((s) => (
                    <TabsTrigger key={s.key} value={s.key}>
                      {s.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {SECTIONS.map((s) => (
                  <TabsContent key={s.key} value={s.key} className="mt-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {data[s.key].trim() ? (
                        <ReactMarkdown>{data[s.key]}</ReactMarkdown>
                      ) : (
                        <p className="text-muted-foreground italic">No content yet.</p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
