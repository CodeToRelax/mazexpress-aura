import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Phone, Mail, ExternalLink, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import { getWarehouseById } from '@/utilities/api/warehouses.api';
import { WarehouseStatus } from '@/types/warehouse';
import { format } from 'date-fns';
import { EditWarehouseDialog } from './EditWarehouseDialog';
import { generateWarehousePDF } from '@/utilities/helpers/warehousePDF';
import { toast } from '@/hooks/use-toast';

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => getWarehouseById(id!),
    enabled: !!id,
  });

  const warehouse = response?.data;

  const handleGeneratePDF = () => {
    if (!warehouse) return;
    
    try {
      if (warehouse.status !== 'open') {
        toast({
          title: t('status.error'),
          description: 'PDF generation is only available for open warehouses',
          variant: 'destructive',
        });
        return;
      }
      generateWarehousePDF(warehouse);
      toast({
        title: t('status.success'),
        description: 'Generating PDF...',
      });
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : 'PDF generation failed',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !warehouse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <InlineError
          message={error instanceof Error ? error.message : t('warehouses.messages.error')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 relative z-10">
        <Button variant="outline" size="icon" onClick={() => navigate('/warehouses')} className="glass-card hover:shadow-glass-hover">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)} className="glass-card hover:shadow-glass-hover">
          <Edit className="h-5 w-5" />
        </Button>
        {warehouse.status === WarehouseStatus.OPEN && (
          <Button variant="outline" size="icon" onClick={handleGeneratePDF} className="glass-card hover:shadow-glass-hover" title="Generate PDF">
            <FileText className="h-5 w-5" />
          </Button>
        )}
        {warehouse.address.googleMapsUrl && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              navigator.clipboard.writeText(warehouse.address.googleMapsUrl);
              toast({
                title: t('status.success'),
                description: 'Google Maps URL copied to clipboard',
              });
            }}
            className="glass-card hover:shadow-glass-hover"
            title="Copy Google Maps URL"
          >
            <MapPin className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground capitalize">{warehouse.name}</h1>
          <p className="text-muted-foreground mt-1">
            {warehouse.address.city}, {warehouse.address.country}
          </p>
        </div>
        <Badge
          variant={warehouse.status === WarehouseStatus.OPEN ? 'default' : 'secondary'}
          className="w-fit"
        >
          {warehouse.status === WarehouseStatus.OPEN
            ? t('warehouses.table.status.open')
            : t('warehouses.table.status.closed')}
        </Badge>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t('warehouses.detail.address')}</h2>
          </div>
          <div className="space-y-2 text-sm">
            {warehouse.address.street && (
              <p>
                <span className="text-muted-foreground">
                  {t('warehouses.detail.fields.street')}:
                </span>{' '}
                {warehouse.address.street}
              </p>
            )}
            {warehouse.address.neighborhood && (
              <p>
                <span className="text-muted-foreground">
                  {t('warehouses.detail.fields.neighborhood')}:
                </span>{' '}
                {warehouse.address.neighborhood}
              </p>
            )}
            {warehouse.address.district && (
              <p>
                <span className="text-muted-foreground">
                  {t('warehouses.detail.fields.district')}:
                </span>{' '}
                {warehouse.address.district}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">
                {t('warehouses.detail.fields.city')}:
              </span>{' '}
              {warehouse.address.city}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t('warehouses.detail.fields.country')}:
              </span>{' '}
              {warehouse.address.country}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t('warehouses.detail.fields.zipCode')}:
              </span>{' '}
              {warehouse.address.zipCode}
            </p>
          </div>
        </Card>

        {/* Contact Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t('warehouses.detail.contact')}</h2>
          <div className="space-y-3">
            {warehouse.phoneNumber && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{warehouse.phoneNumber}</span>
              </div>
            )}
            {warehouse.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{warehouse.email}</span>
              </div>
            )}
            {warehouse.youtubeUrl && (
              <Button variant="link" asChild className="p-0 h-auto">
                <a href={warehouse.youtubeUrl} target="_blank" rel="noopener noreferrer">
                  {t('actions.viewVideo')} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">
                {t('warehouses.detail.fields.createdAt')}:
              </span>{' '}
              {format(new Date(warehouse.createdAt), 'PPP')}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t('warehouses.detail.fields.updatedAt')}:
              </span>{' '}
              {format(new Date(warehouse.updatedAt), 'PPP')}
            </p>
          </div>
        </Card>
      </div>

      {/* Operating Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t('warehouses.detail.hours')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(warehouse.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium capitalize">
                {t(`warehouses.detail.days.${day}`)}
              </span>
              {hours.isOpen ? (
                <span className="text-sm text-success">
                  {hours.openTime} - {hours.closeTime}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('warehouses.detail.times.closed')}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Dialog */}
      <EditWarehouseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        warehouse={warehouse}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
