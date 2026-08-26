import type { ObjectiveView } from '../../types/track';
import { ObjectiveKind } from '../../types/track';

interface Props {
  objective: ObjectiveView;
  color: string;
  /** Report one unit of progress on this objective's metric. */
  onReport?: (objective: ObjectiveView) => void;
  reporting?: boolean;
}

/**
 * One goal inside a track.
 *
 * Leads with what is still missing rather than what is done — "noch 12 Tage"
 * is the number that decides whether someone keeps going, while "3 von 15"
 * mostly reads as how far there is left to fall.
 */
export function ObjectiveRow({ objective, color, onReport, reporting }: Props) {
  const percent = Math.round(objective.ratio * 100);
  const isStreak = objective.kind === ObjectiveKind.STREAK;

  return (
    <li
      className={`rounded-2xl p-4 transition ${
        objective.done
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
          : objective.locked
            ? 'bg-slate-50 opacity-60 dark:bg-slate-800/40'
            : 'bg-slate-50 dark:bg-slate-800/60'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
            objective.done
              ? 'bg-emerald-100 dark:bg-emerald-900/50'
              : 'bg-white dark:bg-slate-900'
          }`}
          aria-hidden
        >
          {objective.locked ? '🔒' : objective.done ? '✅' : objective.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4
              className={`text-sm font-bold leading-snug ${
                objective.done
                  ? 'text-emerald-800 line-through dark:text-emerald-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {objective.title}
            </h4>

            {objective.optional && (
              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Bonus
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {objective.locked
              ? 'Wird in einem späteren Kapitel freigeschaltet.'
              : objective.description}
          </p>

          {!objective.locked && !objective.done && (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: color }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {objective.remainingLabel}
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  +{objective.xpReward} XP
                </span>
              </div>

              {/* A broken streak is worth showing: the record is proof it was
                  already done once. */}
              {isStreak && objective.best > objective.current && (
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Dein Rekord: {objective.best} Tage
                </p>
              )}
            </>
          )}

          {objective.done && (
            <p className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Geschafft · +{objective.xpReward} XP
            </p>
          )}
        </div>
      </div>

      {onReport && !objective.done && !objective.locked && (
        <button
          type="button"
          onClick={() => onReport(objective)}
          disabled={reporting}
          className="mt-3.5 w-full rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 dark:bg-slate-900"
          style={{ borderColor: color, color }}
        >
          {reporting ? 'Wird gespeichert …' : 'Heute erledigt'}
        </button>
      )}
    </li>
  );
}
