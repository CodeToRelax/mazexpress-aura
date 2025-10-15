import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AuthLayoutGlassProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayoutGlass({ children, className }: AuthLayoutGlassProps) {
  return (
    <>
      {/* Mobile: Full screen layout */}
      <div className="md:hidden glass-background min-h-screen w-full flex flex-col">
        {/* Controls at top */}
        <div className="flex items-center justify-end gap-2 p-3 z-50">
          {/* <LanguageToggle /> */}
          {/* <ThemeToggle /> */}
        </div>
        
        {/* Content fills remaining space */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className={cn('w-full max-w-sm', className)}>
            {children}
          </div>
        </div>
      </div>
      
      {/* Desktop: Centered card */}
      <div className="hidden md:flex glass-background min-h-screen w-full items-center justify-center p-4">
        <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
          {/* <LanguageToggle /> */}
          {/* <ThemeToggle /> */}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className={cn(
            'glass-card rounded-lg w-full max-w-md p-8',
            'interactive-scale',
            className
          )}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}
