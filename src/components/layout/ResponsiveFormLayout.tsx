import { cn } from '@/lib/utils';

interface ResponsiveFormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive form layout that adapts structure based on screen size:
 * - Mobile: Single column, full width
 * - Tablet: 2 columns for appropriate fields
 * - Desktop: Multi-column with logical grouping
 */
export function ResponsiveFormLayout({ children, className }: ResponsiveFormLayoutProps) {
  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {children}
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}

/**
 * Form section with responsive grid layout
 * columns prop controls desktop layout, mobile is always single column
 */
export function FormSection({ 
  title, 
  description, 
  children, 
  className,
  columns = 1 
}: FormSectionProps) {
  const gridCols = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(
        'grid grid-cols-1 gap-4 sm:gap-6',
        gridCols[columns]
      )}>
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Individual form field wrapper
 * fullWidth makes it span all columns on desktop
 */
export function FormField({ children, fullWidth, className }: FormFieldProps) {
  return (
    <div className={cn(
      'space-y-2',
      fullWidth && 'md:col-span-full',
      className
    )}>
      {children}
    </div>
  );
}
