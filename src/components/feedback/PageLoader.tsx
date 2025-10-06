import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

export function PageLoader() {
  return (
    <div className="glass-background min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </motion.div>
    </div>
  );
}
