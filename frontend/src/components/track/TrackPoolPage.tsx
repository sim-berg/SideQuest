import { useEffect, useMemo, useState } from 'react';
import { useTrackStore } from '../../stores/useTrackStore';
import { TrackKind } from '../../types/track';
import { TrackCard } from './TrackCard';
import { TrackDetailSheet } from './TrackDetailSheet';

type Tab = 'mine' | 'challenges' | 'story';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mine', label: 'Meine' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'story', label: 'Story' },
];

/**
 * The quest pool.
 *
 * Opens on "Meine" when the user has something running — the recurring visit is
 * to check progress, not to browse — and falls back to the catalog otherwise.
 */
export function TrackPoolPage() {
  const { pool, mine, loading, error, openSlug, loadPool, loadMine, accept, open } =
    useTrackStore();
  const [tab, setTab] = useState<Tab>('challenges');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    void loadPool();
    void loadMine();
  }, [loadPool, loadMine]);

  // Pick the landing tab once, after the first load settles.
  useEffect(() => {
    if (initialised || loading) return;
    if (mine.some((t) => t.status === 'active')) setTab('mine');
    setInitialised(true);
  }, [initialised, loading, mine]);

  const visible = useMemo(() => {
    if (tab === 'mine') return mine;
    const kind = tab === 'story' ? TrackKind.STORY_ARC : TrackKind.CHALLENGE;
    return pool.filter((t) => t.kind === kind);
  }, [tab, pool, mine]);

  const openTrack = useMemo(
    () =>
      [...mine, ...pool].find((t) => t.slug === openSlug) ?? null,
    [openSlug, mine, pool],
  );

  const activeCount = mine.filter((t) => t.status === 'active').length;

  async function handleAccept(slug: string) {
    setAccepting(slug);
    try {
      await accept(slug);
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
      <header className="mb-6 px-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Challenges
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Mehrere Quests, ein Ziel. Jede abgeschlossene Challenge bringt XP und
          ein Emblem.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Challenge-Kategorien"
        className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            {t.id === 'mine' && activeCount > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading && visible.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-400">Lädt …</p>
      )}

      {!loading && visible.length === 0 && (
        <div className="rounded-3xl bg-slate-50 px-6 py-16 text-center dark:bg-slate-800/50">
          <p className="text-4xl" aria-hidden>
            🎯
          </p>
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            {tab === 'mine'
              ? 'Du hast noch keine Challenge angenommen.'
              : 'Hier ist gerade nichts.'}
          </p>
          {tab === 'mine' && (
            <button
              type="button"
              onClick={() => setTab('challenges')}
              className="mt-5 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
            >
              Challenges ansehen
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {visible.map((track) => (
          <TrackCard
            key={track.slug}
            track={track}
            onOpen={open}
            onAccept={handleAccept}
            accepting={accepting === track.slug}
          />
        ))}
      </div>

      {openTrack && (
        <TrackDetailSheet track={openTrack} onClose={() => open(null)} />
      )}
    </div>
  );
}
