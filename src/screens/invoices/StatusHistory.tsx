import { useTranslation } from 'react-i18next';
import { Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatusChange {
  _id: string;
  from: string;
  to: string;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

interface StatusHistoryProps {
  invoiceId: string;
  statusChanges?: StatusChange[];
}

export function StatusHistory({ invoiceId, statusChanges }: StatusHistoryProps) {
  const { t } = useTranslation();

  // If no status history available, show info message
  if (!statusChanges || statusChanges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('invoice.statusHistory.title')}
          </CardTitle>
          <CardDescription>{t('invoice.statusHistory.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {t('invoice.statusHistory.noHistory')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('invoice.statusHistory.title')}
        </CardTitle>
        <CardDescription>{t('invoice.statusHistory.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {statusChanges.map((change, index) => (
            <div key={change._id} className="relative pl-14 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div className="absolute left-4 top-2 h-4 w-4 rounded-full bg-primary border-4 border-background" />

              <div className="space-y-2">
                {/* Status transition */}
                <div className="flex items-center gap-2 flex-wrap">
                  <InvoiceStatusBadge status={change.from as any} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <InvoiceStatusBadge status={change.to as any} />
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(change.changedAt), 'PPp')}</span>
                </div>

                {/* Changed by */}
                {change.changedBy && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{change.changedBy}</span>
                  </div>
                )}

                {/* Reason */}
                {change.reason && (
                  <p className="text-sm text-muted-foreground italic">
                    "{change.reason}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
