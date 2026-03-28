import { useEffect, useState } from 'react';
import {
  useToastStore,
  type Toast,
  type ToastType,
} from '../../stores/useToastStore';
import { cn } from '../../utils/cn';

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  info: 'ℹ',
  quest: '⚔️',
  error: '✕',
};

const TOAST_ACCENT: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  info: 'bg-indigo-500',
  quest: 'bg-amber-500',
  error: 'bg-red-500',
};

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Enter: trigger on next frame (mirrors XpToast pattern)
    requestAnimationFrame(() => setVisible(true));

    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for exit transition (300ms) then remove from store
      setTimeout(onDone, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [onDone, toast.duration]);

  return (
    <div
      className={cn(
        'flex w-full max-w-xs items-start gap-3 overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800',
        'transition-all duration-300',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      )}
    >
      {/* Left accent bar + icon */}
      <div
        className={cn(
          'flex w-10 flex-shrink-0 flex-col items-center justify-center self-stretch py-4',
          TOAST_ACCENT[toast.type],
        )}
      >
        <span className="text-sm font-bold text-white">
          {TOAST_ICONS[toast.type]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 py-3 pr-4">
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDone, 300);
        }}
        className="flex-shrink-0 self-start p-3 text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
        aria-label="Schliessen"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-24 right-4 z-[200] flex flex-col items-end gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDone={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
