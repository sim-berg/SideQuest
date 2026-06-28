import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useToastStore, type Toast as ToastModel } from '../../stores/useToastStore';

function ToastItem({ toast }: { toast: ToastModel }) {
  const dismissToast = useToastStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), 2500);
    return () => clearTimeout(timer);
  }, [toast.id, dismissToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl dark:bg-white dark:text-slate-900"
    >
      <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-500" />
      {toast.message}
    </motion.div>
  );
}

/** Global toast stack, anchored bottom-center above the tab bar. */
export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[120] flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
