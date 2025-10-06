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
    <div className="glass-background min-h-screen w-full flex items-center justify-center p-4">
      {/* Language & Theme Controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      {/* Main Content Card */}
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
  );
}
