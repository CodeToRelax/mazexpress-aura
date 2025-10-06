import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountryConfigCard } from './CountryConfigCard';
import { getSystemConfig } from '@/utilities/api/config.api';
import { toast } from '@/hooks/use-toast';

interface CountryConfig {
  seaShippingRate: number;
  airShippingRate: number;
  seaShippingFactor: number;
  airShippingFactor: number;
}

interface SystemConfigData {
  lydExchangeRate: number;
  countries: Record<string, CountryConfig>;
}

const COUNTRIES = [
  { key: 'libya', name: 'Libya' },
  { key: 'turkey', name: 'Turkey' },
  { key: 'china', name: 'China' },
  { key: 'uae', name: 'UAE' },
];

export default function SystemSettings() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SystemConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConfig = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    try {
      const data = await getSystemConfig();
      setConfig({
        lydExchangeRate: data.lydExchangeRate,
        countries: data.countries,
      });
      if (isRefresh) {
        toast({
          title: 'Success',
          description: 'Configuration refreshed successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load system configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">System Settings</h1>
                <p className="text-sm text-muted-foreground">Manage shipping configurations</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchConfig(true)}
            disabled={isRefreshing}
            className="hover:bg-muted"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue={COUNTRIES[0].key} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              {COUNTRIES.map((country) => (
                <TabsTrigger key={country.key} value={country.key}>
                  {country.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {COUNTRIES.map((country) => (
              <TabsContent key={country.key} value={country.key} className="mt-0">
                {config?.countries[country.key] ? (
                  <CountryConfigCard
                    country={country.key}
                    displayName={country.name}
                    config={config.countries[country.key]}
                    onUpdate={fetchConfig}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No configuration found for {country.name}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
