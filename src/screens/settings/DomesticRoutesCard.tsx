import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Loader2, Route } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { getDomesticRoutes, setRoutePrice, deleteRoute, deleteOriginCity } from '@/utilities/api/config.api';
import { EditableRouteCell } from './EditableRouteCell';
import { AddOriginCityDialog } from './AddOriginCityDialog';
import { AddRouteDialog } from './AddRouteDialog';
import { DeleteRouteDialog } from './DeleteRouteDialog';
import { DeleteOriginCityDialog } from './DeleteOriginCityDialog';

interface DomesticRoutesCardProps {
  onUpdate?: () => void;
}

function formatCityName(city: string): string {
  return city
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function DomesticRoutesCard({ onUpdate }: DomesticRoutesCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [routes, setRoutes] = useState<Record<string, Record<string, number>>>({});
  const [originCities, setOriginCities] = useState<string[]>([]);
  
  // Dialog states
  const [addOriginDialogOpen, setAddOriginDialogOpen] = useState(false);
  const [addRouteDialogOpen, setAddRouteDialogOpen] = useState(false);
  const [selectedOriginForRoute, setSelectedOriginForRoute] = useState<string | null>(null);
  const [deleteRouteData, setDeleteRouteData] = useState<{ origin: string; destination: string } | null>(null);
  const [deleteOriginData, setDeleteOriginData] = useState<string | null>(null);

  // Get all unique destination cities across all origins
  const allDestinationCities = useMemo(() => {
    const cities = new Set<string>();
    Object.values(routes).forEach(destinations => {
      Object.keys(destinations).forEach(city => cities.add(city));
    });
    return Array.from(cities).sort();
  }, [routes]);

  const fetchRoutes = async () => {
    try {
      const data = await getDomesticRoutes();
      setRoutes(data.domestic);
      setOriginCities(data.originCities);
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticRoutes.fetchFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handlePriceUpdate = async (originCity: string, destinationCity: string, price: number) => {
    try {
      await setRoutePrice(originCity, destinationCity, price);
      toast.success(t('common.success'), {
        description: t('settings.domesticRoutes.routeUpdated'),
      });
      fetchRoutes();
      onUpdate?.();
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticRoutes.updateFailed'),
      });
      throw error;
    }
  };

  const handleDeleteRoute = async () => {
    if (!deleteRouteData) return;
    
    try {
      await deleteRoute(deleteRouteData.origin, deleteRouteData.destination);
      toast.success(t('common.success'), {
        description: t('settings.domesticRoutes.routeDeleted'),
      });
      fetchRoutes();
      onUpdate?.();
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticRoutes.deleteFailed'),
      });
    } finally {
      setDeleteRouteData(null);
    }
  };

  const handleDeleteOriginCity = async () => {
    if (!deleteOriginData) return;
    
    try {
      await deleteOriginCity(deleteOriginData);
      toast.success(t('common.success'), {
        description: t('settings.domesticRoutes.originCityDeleted'),
      });
      fetchRoutes();
      onUpdate?.();
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('settings.domesticRoutes.deleteFailed'),
      });
    } finally {
      setDeleteOriginData(null);
    }
  };

  const handleAddRoute = (originCity: string) => {
    setSelectedOriginForRoute(originCity);
    setAddRouteDialogOpen(true);
  };

  const handleRouteAdded = () => {
    fetchRoutes();
    setAddRouteDialogOpen(false);
    setSelectedOriginForRoute(null);
    onUpdate?.();
  };

  const handleOriginCityAdded = () => {
    fetchRoutes();
    setAddOriginDialogOpen(false);
    onUpdate?.();
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            {t('settings.domesticRoutes.title')}
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
                <Route className="h-5 w-5" />
                {t('settings.domesticRoutes.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.domesticRoutes.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setAddOriginDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('settings.domesticRoutes.addOriginCity')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {originCities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('settings.domesticRoutes.noRoutes')}</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">
                        {t('settings.domesticRoutes.fromTo')}
                      </TableHead>
                      {allDestinationCities.map(city => (
                        <TableHead key={city} className="text-center min-w-[100px]">
                          {formatCityName(city)}
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[60px]">
                        <Plus className="h-4 w-4 mx-auto text-muted-foreground" />
                      </TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {originCities.map(originCity => (
                      <TableRow key={originCity}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                          {formatCityName(originCity)}
                        </TableCell>
                        {allDestinationCities.map(destCity => {
                          const isSameCity = originCity.toLowerCase() === destCity.toLowerCase();
                          const price = routes[originCity]?.[destCity];
                          const hasRoute = price !== undefined;

                          if (isSameCity) {
                            return (
                              <TableCell key={destCity} className="text-center">
                                <span className="text-muted-foreground">—</span>
                              </TableCell>
                            );
                          }

                          if (hasRoute) {
                            return (
                              <TableCell key={destCity} className="text-center p-1">
                                <EditableRouteCell
                                  price={price}
                                  originCity={originCity}
                                  destinationCity={destCity}
                                  onSave={handlePriceUpdate}
                                  onDelete={() => setDeleteRouteData({ origin: originCity, destination: destCity })}
                                />
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={destCity} className="text-center">
                              <span className="text-muted-foreground/50">-</span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleAddRoute(originCity)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('settings.domesticRoutes.addRoute')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteOriginData(originCity)}
                                  disabled={originCities.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('settings.domesticRoutes.deleteOriginCity')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AddOriginCityDialog
        open={addOriginDialogOpen}
        onOpenChange={setAddOriginDialogOpen}
        onSuccess={handleOriginCityAdded}
        existingOriginCities={originCities}
      />

      <AddRouteDialog
        open={addRouteDialogOpen}
        onOpenChange={setAddRouteDialogOpen}
        onSuccess={handleRouteAdded}
        originCity={selectedOriginForRoute || ''}
        existingDestinations={selectedOriginForRoute ? Object.keys(routes[selectedOriginForRoute] || {}) : []}
      />

      <DeleteRouteDialog
        open={!!deleteRouteData}
        onOpenChange={(open) => !open && setDeleteRouteData(null)}
        originCity={deleteRouteData?.origin || ''}
        destinationCity={deleteRouteData?.destination || ''}
        onConfirm={handleDeleteRoute}
      />

      <DeleteOriginCityDialog
        open={!!deleteOriginData}
        onOpenChange={(open) => !open && setDeleteOriginData(null)}
        originCity={deleteOriginData || ''}
        onConfirm={handleDeleteOriginCity}
      />
    </>
  );
}
