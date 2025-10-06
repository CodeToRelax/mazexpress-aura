import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InlineErrorProps {
  message?: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn('flex items-center gap-2 text-sm text-destructive', className)}
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
