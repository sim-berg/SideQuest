import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface OverlayPageProps {
  /** Icon shown left of the title — usually a lucide icon element. */
  icon?: ReactNode;
  title: string;
  onClose: () => void;
  /** Header controls placed left of the close button. */
  actions?: ReactNode;
  /** Row directly under the header, inside the fixed part (e.g. a tab switch). */
  toolbar?: ReactNode;
  /** Dark room styling (the forge) instead of the default paper look. */
  tone?: 'default' | 'dark';
  /** Extra classes for the scrolling body. */
  bodyClassName?: string;
  /** Extra classes for the centered content column (e.g. `max-w-none`). */
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Shared frame for every full-screen page behind the hub menu — same header
 * height, same title position, same close button in the top right corner.
 */
export default function OverlayPage({
  icon,
  title,
  onClose,
  actions,
  toolbar,
  tone = 'default',
  bodyClassName,
  contentClassName,
  children,
}: OverlayPageProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dark = tone === 'dark';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex flex-col transition-colors duration-300',
        dark ? 'bg-[#17110d]' : 'bg-white dark:bg-slate-900',
      )}
    >
      {/* Header — title left, actions + close right */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-3 border-b px-4',
          dark
            ? 'border-amber-900/40'
            : 'border-slate-100 dark:border-slate-800',
        )}
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        {icon && <span className="flex shrink-0 items-center">{icon}</span>}
        <h1
          className={cn(
            'truncate text-lg font-bold',
            dark ? 'text-amber-50' : 'text-slate-900 dark:text-white',
          )}
        >
          {title}
        </h1>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {actions}
          <button
            onClick={onClose}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
              dark
                ? 'text-amber-100/80 hover:bg-amber-900/40'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
            aria-label="Schließen"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {toolbar}

      <div
        className={cn(
          'flex-1 overflow-y-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]',
          bodyClassName,
        )}
      >
        <div className={cn('mx-auto w-full max-w-2xl', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
