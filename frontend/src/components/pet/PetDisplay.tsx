import { useState } from 'react';
import { usePetStore, selectActivePet } from '../../stores/usePetStore';
import { activatePet, renamePet } from '../../services/pet.service';
import { ELEMENT_META, STAGE_LABELS, MOOD_META, RARITY_META } from '../../constants/pets';
import { getPetMood, getNextStageThreshold } from '../../utils/pet';
import PetAvatar from './PetAvatar';
import PetChat from './PetChat';
import { cn } from '../../utils/cn';

/**
 * Profile card for the active companion plus the menagerie strip: every pet
 * the user has collected, tap to make one the active guide.
 */
export default function PetDisplay() {
  const pets = usePetStore((s) => s.pets);
  const upsertPet = usePetStore((s) => s.upsertPet);
  const active = selectActivePet({ pets });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [soulOpen, setSoulOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  if (!active) return null;

  const isEgg = !active.species;
  const element = active.element ? ELEMENT_META[active.element] : null;
  const color = element?.color ?? '#94a3b8';
  const mood = MOOD_META[getPetMood(active.lastQuestCompletedAt)];
  const threshold = getNextStageThreshold(active.xp);
  const progress = threshold
    ? Math.min(
        1,
        (active.xp - threshold.currentXp) /
          (threshold.nextXp - threshold.currentXp),
      )
    : 1;

  const handleActivate = async (id: string) => {
    if (id === active.id) return;
    try {
      upsertPet(await activatePet(id));
    } catch {
      /* ignore */
    }
  };

  const handleRename = async () => {
    setEditingName(false);
    const name = nameDraft.trim();
    if (!name || name === active.name) return;
    try {
      upsertPet(await renamePet(active.id, name));
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
      style={{ background: `linear-gradient(135deg, ${color}14, transparent 60%)` }}
    >
      <div className="flex items-center gap-4">
        <PetAvatar pet={active} size={64} />
        <div className="min-w-0 flex-1">
          {isEgg ? (
            <>
              <p className="font-bold text-slate-900 dark:text-white">
                Mysteriöses Ei
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Schließe alle Daily-Quests eines Tages ab, um es auszubrüten.
              </p>
            </>
          ) : (
            <>
              {editingName ? (
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  maxLength={24}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <button
                  onClick={() => {
                    setNameDraft(active.name ?? '');
                    setEditingName(true);
                  }}
                  className="truncate text-left font-bold text-slate-900 dark:text-white"
                >
                  {active.name || `${element?.name}-${active.speciesName}`}
                  <span className="ml-1 text-xs font-normal text-slate-400">✏️</span>
                </button>
              )}
              <p className="text-xs font-semibold" style={{ color }}>
                {element?.name} · {active.speciesName}
                {active.rarity && (
                  <span
                    className="ml-1.5"
                    style={{ color: RARITY_META[active.rarity].color }}
                  >
                    {RARITY_META[active.rarity].label}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {STAGE_LABELS[active.stage]} · {mood.emoji} {mood.label}
              </p>
            </>
          )}
        </div>
      </div>

      {/* XP progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{active.xp} XP</span>
          <span>
            {threshold
              ? `${threshold.nextXp} XP bis ${
                  STAGE_LABELS[
                    isEgg
                      ? 'hatchling'
                      : (getStageAfter(active.stage) ?? active.stage)
                  ]
                }`
              : 'Maximale Stufe'}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress * 100}%`, backgroundColor: color }}
          />
        </div>
        {active.currentStreak > 0 && (
          <p className="mt-1.5 text-xs text-orange-500">
            🔥 {active.currentStreak} Tage Streak
          </p>
        )}
      </div>

      {/* Chat */}
      <button
        onClick={() => setChatOpen(true)}
        className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white shadow transition-all active:scale-[0.98]"
        style={{ backgroundColor: color }}
      >
        💬 {isEgg ? 'Dem Ei lauschen' : 'Sprechen'}
      </button>
      {chatOpen && <PetChat pet={active} onClose={() => setChatOpen(false)} />}

      {/* Soul */}
      {!isEgg && active.soul && (
        <div className="mt-3">
          <button
            onClick={() => setSoulOpen(!soulOpen)}
            className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
          >
            {soulOpen ? 'Seele verbergen' : '📜 Seele ansehen'}
          </button>
          {soulOpen && (
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-100 p-3 font-sans text-xs leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {active.soul}
            </pre>
          )}
        </div>
      )}

      {/* Menagerie */}
      {pets.length > 1 && (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Menagerie
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleActivate(p.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all',
                  p.isActive
                    ? 'bg-slate-200/70 dark:bg-slate-700/70'
                    : 'opacity-70 hover:opacity-100',
                )}
              >
                <PetAvatar pet={p} size={44} />
                <span className="max-w-[64px] truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {p.species ? p.name || p.speciesName : 'Ei'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getStageAfter(stage: string): 'juvenile' | 'adult' | 'ancient' | null {
  if (stage === 'hatchling') return 'juvenile';
  if (stage === 'juvenile') return 'adult';
  if (stage === 'adult') return 'ancient';
  return null;
}
