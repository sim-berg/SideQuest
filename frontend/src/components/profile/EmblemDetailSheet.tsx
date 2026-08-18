import { useEffect } from 'react';
import { CalendarDays, MapPin, Scroll, X } from 'lucide-react';
import type { Emblem, EmblemSource } from '../../types/achievement';
import EmblemBadge from './EmblemBadge';

const SOURCE_LABEL: Record<EmblemSource, string> = {
  sidequest: 'SideQuest abgeschlossen',
  daily: 'Tagesquest abgeschlossen',
  quest: 'Quest abgeschlossen',
  milestone: 'Meilenstein erreicht',
  signup: 'Beim Start erhalten',
};

function formatEarnedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * The story behind one emblem: when it was earned, from which side quest, and
 * where the owner stood at the time. Visible to anyone browsing the profile —
 * that log is what makes an emblem worth showing off.
 */
export default function EmblemDetailSheet({
  emblem,
  ownerName,
  onClose,
}: {
  emblem: Emblem;
  ownerName?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasCoords = emblem.lat !== null && emblem.lng !== null;
  const place =
    emblem.placeLabel ||
    (hasCoords ? `${emblem.lat!.toFixed(4)}, ${emblem.lng!.toFixed(4)}` : '');

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <EmblemBadge emblem={emblem} size="lg" />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {emblem.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {emblem.description}
          </p>
          {ownerName && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Emblem von {ownerName}
            </p>
          )}
        </div>

        {/* The log — what was actually recorded when this was awarded */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <LogRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Wann"
            value={formatEarnedAt(emblem.earnedAt)}
          />
          <LogRow
            icon={<Scroll className="h-4 w-4" />}
            label="Wodurch"
            value={
              emblem.questTitle
                ? `${emblem.questTitle} · ${SOURCE_LABEL[emblem.sourceKind]}`
                : SOURCE_LABEL[emblem.sourceKind]
            }
          />
          {place && (
            <LogRow
              icon={<MapPin className="h-4 w-4" />}
              label="Wo"
              value={place}
            />
          )}
        </div>

        {hasCoords && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${emblem.lat}&mlon=${emblem.lng}#map=16/${emblem.lat}/${emblem.lng}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 block w-full rounded-xl border-2 border-slate-200 py-2.5 text-center text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Ort auf der Karte ansehen
          </a>
        )}
      </div>
    </div>
  );
}

function LogRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
          {label}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
