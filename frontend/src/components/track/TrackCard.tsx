import type { Track } from '../../types/track';
import { TrackKind } from '../../types/track';

interface Props {
  track: Track;
  onOpen: (slug: string) => void;
  onAccept: (slug: string) => void;
  /** Set while this card's accept request is in flight. */
  accepting?: boolean;
}

/**
 * A track in the pool.
 *
 * Two states, one card: not yet accepted, the accept CTA is the loudest thing
 * on it; once running, that space becomes the progress readout and the next
 * missing step, because the question changes from "do I want this?" to
 * "what do I still have to do?".
 */
export function TrackCard({ track, onOpen, onAccept, accepting }: Props) {
  const running = track.enrolled && track.status === 'active';
  const done = track.status === 'completed';
  const percent = Math.round(track.ratio * 100);

  return (
    <article
      className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md dark:bg-slate-900 dark:ring-slate-800"
      style={{ borderTop: `4px solid ${track.color}` }}
    >
      <button
        type="button"
        onClick={() => onOpen(track.slug)}
        className="block w-full p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: `${track.color}1a` }}
            aria-hidden
          >
            {track.emoji}
          </span>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: track.color }}
              >
                {track.kind === TrackKind.STORY_ARC ? 'Story' : 'Challenge'}
              </span>
              {done && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Abgeschlossen
                </span>
              )}
              {track.daysLeft !== null && running && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Noch {track.daysLeft} Tage
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
              {track.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {track.tagline}
            </p>
          </div>
        </div>

        {/* Running: progress replaces the pitch. */}
        {running && (
          <div className="mt-5 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {track.doneCount} von {track.requiredCount} Zielen
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: track.color }}
              >
                {percent}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, backgroundColor: track.color }}
              />
            </div>

            {track.missing.length > 0 && (
              <p className="pt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Als Nächstes:
                </span>{' '}
                {track.missing[0]}
                {track.missing.length > 1 && (
                  <span className="text-slate-400 dark:text-slate-500">
                    {' '}
                    · +{track.missing.length - 1} weitere
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Not running: what it costs and what it pays. */}
        {!track.enrolled && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">
              {track.requiredCount} Ziele
            </span>
            <span>+{track.completionXp.toLocaleString('de-DE')} XP</span>
            {track.completionCoins > 0 && (
              <span>{track.completionCoins} Taler</span>
            )}
            {track.durationDays && <span>{track.durationDays} Tage</span>}
          </div>
        )}
      </button>

      {/* The CTA sits outside the open-detail button so it is unmistakably
          its own action rather than part of the card tap. */}
      {!track.enrolled && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => onAccept(track.slug)}
            disabled={accepting}
            className="w-full rounded-2xl px-5 py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: track.color }}
          >
            {accepting ? 'Wird angenommen …' : 'Annehmen'}
          </button>
        </div>
      )}

      {done && (
        <div className="border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            🏅 Emblem verdient · +{track.xpEarned.toLocaleString('de-DE')} XP
          </p>
        </div>
      )}
    </article>
  );
}
