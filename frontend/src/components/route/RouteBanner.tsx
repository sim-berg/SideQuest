import { Compass, X, Footprints, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { CATEGORY_META } from '../../constants/categories';
import { formatDistance } from '../../utils/format';
import { formatDuration } from '../../utils/geo';

/**
 * Google-Maps-style route summary pinned above the bottom nav while a route is
 * active: distance, walking ETA, a shortcut into the Adventure-mode compass,
 * and a dismiss button.
 */
export default function RouteBanner() {
  const destination = useRouteStore((s) => s.destination);
  const route = useRouteStore((s) => s.route);
  const loading = useRouteStore((s) => s.loading);
  const error = useRouteStore((s) => s.error);
  const clearRoute = useRouteStore((s) => s.clearRoute);
  const openCompass = useRouteStore((s) => s.openCompass);
  const compassOpen = useRouteStore((s) => s.compassOpen);

  // Hide behind the compass — it has its own chrome.
  if (!destination || compassOpen) return null;

  const color = CATEGORY_META[destination.category]?.color ?? '#6366f1';

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl bg-white/95 p-3 shadow-2xl backdrop-blur dark:bg-slate-800/95">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: `${color}22` }}
        >
          {CATEGORY_META[destination.category]?.icon ?? '📍'}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {destination.title}
          </h3>

          {loading && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Route wird berechnet...
            </p>
          )}

          {error && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{error}</span>
            </p>
          )}

          {route && !loading && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Footprints className="h-3.5 w-3.5" style={{ color }} />
              {formatDistance(route.distanceMeters / 1000)}
              <span className="text-slate-300 dark:text-slate-600">·</span>
              {formatDuration(route.durationMin)}
            </p>
          )}
        </div>

        <button
          onClick={() => openCompass()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform active:scale-90"
          style={{ backgroundColor: color }}
          aria-label="Kompass öffnen"
        >
          <Compass className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <button
          onClick={clearRoute}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Route beenden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
