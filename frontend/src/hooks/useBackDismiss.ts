import { useEffect, useRef } from 'react';

/**
 * Hardware/browser back button handling for overlays.
 *
 * The app is a single URL with a lot of state-driven layers on top (detail
 * screens, compass, logbook, chat, wizard, tabs). Without this, the first back
 * press leaves the app entirely instead of closing the layer the user is
 * looking at.
 *
 * Every open overlay pushes one history entry tagged with its depth. A back
 * press pops the entry, and the popstate handler dismisses every overlay above
 * the depth we landed on — so back always peels off exactly one layer, and a
 * multi-entry jump (or a wouter navigation, which carries no depth) collapses
 * all of them. Closing an overlay from the UI removes its history entry again,
 * so the back button never has to be pressed twice for the same layer.
 */

interface OverlayEntry {
  depth: number;
  dismiss: () => void;
}

const stack: OverlayEntry[] = [];
let listening = false;

function depthOf(state: unknown): number {
  const depth = (state as { sqDepth?: unknown } | null)?.sqDepth;
  return typeof depth === 'number' ? depth : 0;
}

function ensureListener(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('popstate', (e) => {
    const depth = depthOf(e.state);
    while (stack.length > depth) stack.pop()!.dismiss();
  });
}

/**
 * @param active  whether the overlay is currently showing
 * @param dismiss closes the overlay — called on back, never on unmount
 */
export function useBackDismiss(active: boolean, dismiss: () => void): void {
  const dismissRef = useRef(dismiss);
  useEffect(() => {
    dismissRef.current = dismiss;
  }, [dismiss]);

  useEffect(() => {
    if (!active) return;
    ensureListener();

    const entry: OverlayEntry = {
      depth: stack.length + 1,
      dismiss: () => dismissRef.current(),
    };
    stack.push(entry);
    window.history.pushState(
      { ...(window.history.state as object | null), sqDepth: entry.depth },
      '',
    );

    return () => {
      const i = stack.indexOf(entry);
      // Already gone: a back press dismissed us, and the entry went with it.
      if (i === -1) return;
      stack.splice(i, 1);
      // Only drop the history entry when it is still the current one —
      // otherwise we'd navigate away from an overlay stacked on top of us.
      if (depthOf(window.history.state) === entry.depth) window.history.back();
    };
  }, [active]);
}
