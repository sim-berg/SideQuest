import { useState } from 'react';
import type { ObjectiveView, Track } from '../../types/track';
import { TrackKind } from '../../types/track';
import { useTrackStore } from '../../stores/useTrackStore';
import { ObjectiveRow } from './ObjectiveRow';

interface Props {
  track: Track;
  onClose: () => void;
}

/**
 * The full view of one track: what it is, how far you are, and — the part that
 * matters day to day — exactly what is still missing.
 */
export function TrackDetailSheet({ track, onClose }: Props) {
  const { accept, abandon, report } = useTrackStore();
  const [busy, setBusy] = useState<string | null>(null);

  const running = track.enrolled && track.status === 'active';
  const percent = Math.round(track.ratio * 100);

  const required = track.objectives.filter((o) => !o.optional);
  const optional = track.objectives.filter((o) => o.optional);

  async function handleAccept() {
    setBusy('accept');
    try {
      await accept(track.slug);
    } finally {
      setBusy(null);
    }
  }

  async function handleReport(objective: ObjectiveView) {
    setBusy(objective.id);
    try {
      await report({
        metric: objective.metric,
        // One tap means one unit — a day, a session, an application. Objectives
        // measured in km or minutes get their value from the route recorder
        // instead, never from this button.
        value: 1,
        dedupeKey: `manual:${track.slug}:${objective.id}:${new Date().toDateString()}`,
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleRelapse() {
    if (!track.relapseMetric) return;
    setBusy('relapse');
    try {
      await report({ metric: track.relapseMetric, value: 1 });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white pb-8 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 rounded-t-3xl px-6 pb-5 pt-5"
          style={{ backgroundColor: track.color }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden>
                {track.emoji}
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  {track.kind === TrackKind.STORY_ARC
                    ? 'Story Arc'
                    : 'Challenge'}
                </p>
                <h2 className="text-xl font-bold leading-tight text-white">
                  {track.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Schließen"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg text-white transition hover:bg-white/30"
            >
              ✕
            </button>
          </div>

          {running && (
            <div className="mt-5 space-y-2">
              <div className="flex items-baseline justify-between text-white">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
                  {track.doneCount} von {track.requiredCount} Zielen
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {percent}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-7 px-6 pt-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {track.description}
          </p>

          {/* What is still missing — the headline for a running track. */}
          {running && track.missing.length > 0 && (
            <section className="rounded-2xl border-2 border-dashed border-slate-200 p-5 dark:border-slate-700">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bis zum Abschluss fehlt
              </h3>
              <ul className="space-y-2">
                {track.missing.map((m, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {running && track.missing.length === 0 && (
            <section className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/40">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Alle Pflichtziele erledigt. 🎉
              </p>
            </section>
          )}

          {/* Story arcs narrate; challenges just list. */}
          {track.kind === TrackKind.STORY_ARC && track.chapters && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kapitel {track.currentStep + 1} von {track.chapters.length}
              </h3>
              {track.chapters[track.currentStep] && (
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <h4 className="mb-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    {track.chapters[track.currentStep].title}
                  </h4>
                  <p className="text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
                    {track.chapters[track.currentStep].intro}
                  </p>
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ziele
            </h3>
            <ul className="space-y-3">
              {required.map((o) => (
                <ObjectiveRow
                  key={o.id}
                  objective={o}
                  color={track.color}
                  onReport={running ? handleReport : undefined}
                  reporting={busy === o.id}
                />
              ))}
            </ul>
          </section>

          {optional.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bonusziele · zählen extra, sind aber keine Pflicht
              </h3>
              <ul className="space-y-3">
                {optional.map((o) => (
                  <ObjectiveRow
                    key={o.id}
                    objective={o}
                    color={track.color}
                    onReport={running ? handleReport : undefined}
                    reporting={busy === o.id}
                  />
                ))}
              </ul>
            </section>
          )}

          {track.bonusRules.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bonus-XP
              </h3>
              <ul className="flex flex-wrap gap-2">
                {track.bonusRules.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    ⚡ {b.label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Relapse: deliberately quiet, deliberately present. */}
          {running && track.relapseMetric && (
            <section className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {track.relapseCopy}
              </p>
              <button
                type="button"
                onClick={handleRelapse}
                disabled={busy === 'relapse'}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition active:scale-[0.98] disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
              >
                Rückfall eintragen
              </button>
              {track.relapses > 0 && (
                <p className="mt-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
                  {track.relapses}{' '}
                  {track.relapses === 1 ? 'Rückfall' : 'Rückfälle'} — und du
                  machst weiter.
                </p>
              )}
            </section>
          )}

          {/* Primary action */}
          {!track.enrolled && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={busy === 'accept'}
              className="w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: track.color }}
            >
              {busy === 'accept'
                ? 'Wird angenommen …'
                : `Annehmen · +${track.completionXp.toLocaleString('de-DE')} XP`}
            </button>
          )}

          {running && (
            <button
              type="button"
              onClick={() => abandon(track.slug)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              Challenge aufgeben
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
