/**
 * Background location for a web app — what is actually possible.
 *
 * The honest limits, because designing around a wrong assumption here costs
 * days:
 *
 *  · There is NO web API for location while the app is closed. Service workers
 *    have no `navigator.geolocation` (it is not exposed in
 *    ServiceWorkerGlobalScope), and Periodic Background Sync — Chromium-only,
 *    installed PWAs only — grants no location access either.
 *  · A backgrounded *tab* keeps its `watchPosition` registration, but browsers
 *    throttle or suspend timers and callbacks aggressively. On Android Chrome
 *    updates slow to a trickle; on iOS Safari they stop entirely once the app
 *    leaves the foreground or the screen locks.
 *  · The one lever that genuinely helps is a Screen Wake Lock: with the screen
 *    kept on and the tab visible, `watchPosition` keeps delivering. That covers
 *    the real use case here — a walk or a run recorded while the phone is in
 *    hand or the app is open in a pocket with the screen on.
 *
 * So: this module maximises foreground-continuous tracking and reports
 * truthfully what the current browser grants. Genuine
 * screen-off/app-closed tracking needs a native wrapper (Capacitor's
 * background-geolocation plugin) — see `describeCapabilities()`, which says so
 * in the UI rather than silently under-delivering.
 */

export interface GeoCapabilities {
  /** navigator.geolocation exists at all. */
  supported: boolean;
  /** Permission state, when the Permissions API can tell us. */
  permission: PermissionState | 'unknown';
  /** Screen Wake Lock available — the difference between tracking and not. */
  wakeLockSupported: boolean;
  /** Running as an installed PWA, which gets slightly better treatment. */
  installedPwa: boolean;
  /** True only where continuous tracking survives backgrounding — never on web. */
  trueBackgroundSupported: false;
  /** One-line summary for the UI. */
  summary: string;
}

/** Inspect what this browser will actually grant, without prompting. */
export async function inspectCapabilities(): Promise<GeoCapabilities> {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const wakeLockSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const installedPwa =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(display-mode: standalone)').matches === true;

  let permission: PermissionState | 'unknown' = 'unknown';
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      permission = status.state;
    }
  } catch {
    // Firefox rejects some permission queries — 'unknown' is the right answer.
  }

  return {
    supported,
    permission,
    wakeLockSupported,
    installedPwa,
    trueBackgroundSupported: false,
    summary: buildSummary(supported, permission, wakeLockSupported),
  };
}

function buildSummary(
  supported: boolean,
  permission: PermissionState | 'unknown',
  wakeLock: boolean,
): string {
  if (!supported) return 'Dein Browser unterstützt keine Standortermittlung.';
  if (permission === 'denied')
    return 'Standort ist blockiert. Erlaube ihn in den Browser-Einstellungen, um Routen aufzuzeichnen.';
  if (wakeLock)
    return 'Routen werden aufgezeichnet, solange die App offen und der Bildschirm an ist. Wir halten den Bildschirm dafür wach.';
  return 'Routen werden aufgezeichnet, solange die App im Vordergrund ist. Bei gesperrtem Bildschirm pausiert die Messung.';
}

type PositionHandler = (pos: {
  lat: number;
  lng: number;
  accuracy: number;
  at: number;
}) => void;

let watchId: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
let visibilityHandler: (() => void) | null = null;

/**
 * Start continuous tracking, keeping the screen awake so the browser does not
 * suspend the watch.
 *
 * Re-acquires the wake lock when the tab becomes visible again, because the
 * browser drops it on every hide.
 */
export async function startTracking(
  onPosition: PositionHandler,
  onError?: (err: GeolocationPositionError) => void,
): Promise<GeoCapabilities> {
  const caps = await inspectCapabilities();
  if (!caps.supported) return caps;

  stopTracking();

  watchId = navigator.geolocation.watchPosition(
    (pos) =>
      onPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        at: pos.timestamp,
      }),
    onError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
  );

  await acquireWakeLock();

  // The lock is released automatically whenever the tab hides; take it back.
  visibilityHandler = () => {
    if (document.visibilityState === 'visible' && watchId !== null) {
      void acquireWakeLock();
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  return caps;
}

export function stopTracking(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  void releaseWakeLock();
}

export function isTracking(): boolean {
  return watchId !== null;
}

async function acquireWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch {
    // Denied (battery saver, no user gesture) — tracking still works while
    // the screen happens to be on.
  }
}

async function releaseWakeLock(): Promise<void> {
  try {
    await wakeLock?.release();
  } catch {
    // Already gone.
  }
  wakeLock = null;
}

/**
 * What to tell the user, in plain German, about background tracking.
 * Used by the settings screen so the limitation is stated rather than hidden.
 */
export function describeCapabilities(caps: GeoCapabilities): {
  title: string;
  body: string;
  tone: 'ok' | 'warn' | 'blocked';
} {
  if (!caps.supported) {
    return {
      title: 'Standort nicht verfügbar',
      body: 'Dieser Browser kann deinen Standort nicht ermitteln. Routen-Challenges lassen sich hier nicht automatisch mitzählen — du kannst Fortschritt aber weiterhin von Hand eintragen.',
      tone: 'blocked',
    };
  }
  if (caps.permission === 'denied') {
    return {
      title: 'Standort blockiert',
      body: 'Du hast den Standortzugriff abgelehnt. Erlaube ihn in den Browser-Einstellungen für diese Seite, damit Routen automatisch zählen.',
      tone: 'blocked',
    };
  }
  return {
    title: 'Aufzeichnung im Hintergrund',
    body:
      'Solange SideQuest geöffnet ist, zeichnen wir deine Route auf und halten dafür den Bildschirm wach. ' +
      'Sobald du die App schließt oder der Bildschirm sich sperrt, pausiert die Messung — ' +
      'echtes Tracking im Hintergrund erlauben Browser aus Datenschutzgründen nicht. ' +
      'Verpasste Kilometer kannst du jederzeit von Hand nachtragen.',
    tone: caps.wakeLockSupported ? 'ok' : 'warn',
  };
}
