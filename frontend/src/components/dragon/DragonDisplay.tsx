import { useDragonStore } from '../../stores/useDragonStore';
import { DRAGON_META, EVOLUTION_LABELS, MOOD_META } from '../../constants/dragons';
import { getDragonMood, getNextEvolutionThreshold } from '../../utils/dragon';
import { formatXp } from '../../utils/format';

export default function DragonDisplay() {
  const dragon = useDragonStore((s) => s.dragon);
  if (!dragon) return null;

  const meta = DRAGON_META[dragon.type];
  const mood = getDragonMood(dragon.lastQuestCompletedAt);
  const moodMeta = MOOD_META[mood];
  const threshold = getNextEvolutionThreshold(dragon.xp);
  const emoji = meta.emoji[dragon.evolutionStage];
  const stageLabel = EVOLUTION_LABELS[dragon.evolutionStage];

  const progressPct = threshold
    ? Math.min(
        100,
        ((dragon.xp - threshold.currentXp) / (threshold.nextXp - threshold.currentXp)) * 100,
      )
    : 100;

  return (
    <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/50">
      <div className="flex items-center gap-4">
        {/* Dragon emoji */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: meta.color + '20' }}
        >
          {emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {dragon.name ?? meta.name}
            </h3>
            <span className="text-sm" title={moodMeta.label}>
              {moodMeta.emoji}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stageLabel} &middot; {meta.element}
          </p>

          {/* XP bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>{formatXp(dragon.xp)}</span>
              {threshold && <span>{formatXp(threshold.nextXp)}</span>}
            </div>
            <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: meta.color,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Streak */}
      {dragon.currentStreak > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-sm">🔥</span>
          <span>{dragon.currentStreak} Tage Streak</span>
        </div>
      )}
    </div>
  );
}
