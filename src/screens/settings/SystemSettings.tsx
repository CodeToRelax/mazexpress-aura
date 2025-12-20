import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountryConfigCard } from './CountryConfigCard';
import { DomesticRoutesCard } from './DomesticRoutesCard';
import { ExchangeRateCard } from './ExchangeRateCard';
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
  { key: 'turkey', name: 'Turkey' },
  { key: 'china', name: 'China' },
  { key: 'uae', name: 'UAE' },
];

export default function SystemSettings() {
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
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground">Manage shipping configurations</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchConfig(true)}
          disabled={isRefreshing}
          className="glass-card hover:shadow-glass-hover"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Exchange Rate Section */}
      {config && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <ExchangeRateCard lydExchangeRate={config.lydExchangeRate} onUpdate={fetchConfig} />
        </motion.div>
      )}

      {/* Domestic Routes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-8"
      >
        <DomesticRoutesCard onUpdate={fetchConfig} />
      </motion.div>

      {/* Country Configuration Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs defaultValue={COUNTRIES[0].key} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-8">
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
    </div>
  );
}
