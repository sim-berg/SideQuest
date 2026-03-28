import { useState } from 'react';
import { DRAGON_META } from '../../constants/dragons';
import { chooseDragon } from '../../services/dragon.service';
import { useDragonStore } from '../../stores/useDragonStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { DragonType } from '../../types/dragon';
import { cn } from '../../utils/cn';

const DRAGON_TYPES: DragonType[] = ['ember', 'tide', 'thorn', 'gloom', 'spark'];

export default function DragonSelection() {
  const [selected, setSelected] = useState<DragonType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setDragon = useDragonStore((s) => s.setDragon);
  const updateUser = useAuthStore((s) => s.updateUser);

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const dragon = await chooseDragon(selected);
      setDragon(dragon);
      updateUser({ hasDragon: true });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-12">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-white">
          Waehle deinen Drachen
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Dein Begleiter auf allen Quests. Er waechst mit jeder abgeschlossenen Quest!
        </p>

        <div className="flex flex-col gap-3">
          {DRAGON_TYPES.map((type) => {
            const meta = DRAGON_META[type];
            const active = selected === type;
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={cn(
                  'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                  active
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                )}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: meta.color + '20' }}
                >
                  {meta.emoji.egg}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {meta.name}
                  </p>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: meta.color }}
                  >
                    {meta.element}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-8">
        <button
          onClick={handleConfirm}
          disabled={!selected || submitting}
          className={cn(
            'w-full rounded-xl py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]',
            selected && !submitting
              ? 'bg-indigo-500 active:bg-indigo-600'
              : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700',
          )}
        >
          {submitting ? 'Wird erstellt...' : 'Drache waehlen'}
        </button>
      </div>
      </div>
    </div>
  );
}
