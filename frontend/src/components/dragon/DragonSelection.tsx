import { useState } from 'react';
import { DRAGON_META } from '../../constants/dragons';
import { chooseDragon } from '../../services/dragon.service';
import { useDragonStore } from '../../stores/useDragonStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import type { DragonType } from '../../types/dragon';
import { cn } from '../../utils/cn';

const DRAGON_TYPES: DragonType[] = ['ember', 'tide', 'thorn', 'gloom', 'spark'];

const DRAGON_COLOR_GRADIENTS: Record<DragonType, { light: string; border: string }> = {
  ember: { light: 'from-orange-100 to-red-100 dark:from-orange-950/40 dark:to-red-950/40', border: 'group-hover:border-orange-400 group-hover:shadow-orange-200/50' },
  tide: { light: 'from-blue-100 to-cyan-100 dark:from-blue-950/40 dark:to-cyan-950/40', border: 'group-hover:border-blue-400 group-hover:shadow-blue-200/50' },
  thorn: { light: 'from-emerald-100 to-green-100 dark:from-emerald-950/40 dark:to-green-950/40', border: 'group-hover:border-emerald-400 group-hover:shadow-emerald-200/50' },
  gloom: { light: 'from-purple-100 to-violet-100 dark:from-purple-950/40 dark:to-violet-950/40', border: 'group-hover:border-purple-400 group-hover:shadow-purple-200/50' },
  spark: { light: 'from-yellow-100 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/40', border: 'group-hover:border-yellow-400 group-hover:shadow-yellow-200/50' },
};

export default function DragonSelection() {
  const [selected, setSelected] = useState<DragonType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setDragon = useDragonStore((s) => s.setDragon);
  const updateUser = useAuthStore((s) => s.updateUser);
  const showDragonSelection = useUIStore((s) => s.showDragonSelection);
  const setShowDragonSelection = useUIStore((s) => s.setShowDragonSelection);

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const dragon = await chooseDragon(selected);
      setDragon(dragon);
      updateUser({ hasDragon: true });
      setShowDragonSelection(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (!showDragonSelection) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-[1200px] h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Close button */}
      <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Waehle deinen Drachen</h2>
        <button
          onClick={() => setShowDragonSelection(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Dein Begleiter auf allen Quests. Er waechst mit jeder abgeschlossenen Quest!
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {DRAGON_TYPES.map((type) => {
            const meta = DRAGON_META[type];
            const active = selected === type;
            const colorGradient = DRAGON_COLOR_GRADIENTS[type];
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={cn(
                  'group relative flex flex-col items-center justify-center rounded-3xl border-2 p-6 text-center transition-all duration-300',
                  active
                    ? `border-transparent bg-gradient-to-br ${colorGradient.light} shadow-lg scale-105`
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 hover:shadow-md',
                )}
              >
                <div
                  className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-4xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: meta.color + '20' }}
                >
                  {meta.emoji.egg}
                </div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {meta.name}
                </p>
                <p
                  className="mt-1 text-xs font-semibold"
                  style={{ color: meta.color }}
                >
                  {meta.element}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {meta.description}
                </p>
                {active && (
                  <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                )}
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
