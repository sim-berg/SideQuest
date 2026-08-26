import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useTrackStore } from '../../stores/useTrackStore';
import type { Category, Difficulty } from '../../types/quest';

/** A standard everyday quest offered as a starting point. */
export interface PoolTemplate {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  emoji: string;
}

export interface PoolSelection {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  templateId: string;
}

interface Props {
  /** Called when a standard quest is picked — prefills the create form. */
  onSelect: (selection: PoolSelection) => void;
  /** Called when a challenge is picked, so the page can open its detail sheet. */
  onSelectChallenge?: (slug: string) => void;
}

/**
 * Pre-selection for the create-quest form.
 *
 * Two groups behind one control, because they answer the same question from
 * different angles: a standard quest is one thing to do now, a challenge is a
 * bundle to commit to. Picking a standard quest fills the form; picking a
 * challenge hands off to the challenge sheet, since those are accepted, not
 * authored.
 */
export function QuestPoolPicker({ onSelect, onSelectChallenge }: Props) {
  const [templates, setTemplates] = useState<PoolTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { pool, loadPool } = useTrackStore();

  useEffect(() => {
    let cancelled = false;
    api
      .get<PoolTemplate[]>('/quests/pool')
      .then((t) => !cancelled && setTemplates(t))
      .catch(() => !cancelled && setTemplates([]));
    void loadPool();
    return () => {
      cancelled = true;
    };
  }, [loadPool]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [templates, query]);

  const challenges = useMemo(() => {
    const q = query.trim().toLowerCase();
    const open = pool.filter((t) => !t.enrolled);
    if (!q) return open.slice(0, 6);
    return open.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 6);
  }, [pool, query]);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-slate-300 px-5 py-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-600 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20"
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">
            Aus dem Quest-Pool wählen
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            Standard-Quests und Challenges als Vorlage
          </span>
        </span>
        <span
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen …"
              className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {challenges.length > 0 && (
              <section>
                <h4 className="sticky top-0 bg-slate-50 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Challenges · mehrere Quests, ein Ziel
                </h4>
                <ul>
                  {challenges.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectChallenge?.(c.slug);
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                          style={{ backgroundColor: `${c.color}1a` }}
                          aria-hidden
                        >
                          {c.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {c.title}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {c.requiredCount} Ziele · +{c.completionXp} XP
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h4 className="sticky top-0 bg-slate-50 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Standard-Quests
              </h4>
              {filtered.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-400">
                  Nichts gefunden.
                </p>
              ) : (
                <ul>
                  {filtered.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect({
                            title: t.title,
                            description: t.description,
                            category: t.category,
                            difficulty: t.difficulty,
                            templateId: t.id,
                          });
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800"
                          aria-hidden
                        >
                          {t.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {t.title}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {t.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
