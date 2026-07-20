import { useCallback, useEffect, useRef, useState } from 'react';

/** iOS 13+ gates device orientation behind an explicit user-gesture grant. */
type PermissionState = 'unsupported' | 'prompt' | 'granted' | 'denied';

interface DeviceOrientationEventIOS extends DeviceOrientationEvent {
  /** Safari-only: heading in degrees clockwise from true north. */
  webkitCompassHeading?: number;
}

type DeviceOrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

function needsPermission(): boolean {
  const ctor = window.DeviceOrientationEvent as DeviceOrientationEventCtor | undefined;
  return typeof ctor?.requestPermission === 'function';
}

/**
 * Live compass heading in degrees clockwise from north, or null when the device
 * can't report one (most desktops). Safari exposes a true-north heading
 * directly; elsewhere we derive it from `alpha`, which is relative to the
 * device's own reference frame and only usable when `absolute` is set.
 */
export function useDeviceHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return 'unsupported';
    return needsPermission() ? 'prompt' : 'granted';
  });

  /** Smooth out sensor jitter so the needle doesn't twitch. */
  const smoothed = useRef<number | null>(null);

  const requestAccess = useCallback(async () => {
    const ctor = window.DeviceOrientationEvent as DeviceOrientationEventCtor | undefined;
    if (typeof ctor?.requestPermission !== 'function') {
      setPermission('granted');
      return;
    }
    try {
      const result = await ctor.requestPermission();
      setPermission(result === 'granted' ? 'granted' : 'denied');
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'granted') return;

    const handle = (event: DeviceOrientationEvent) => {
      const e = event as DeviceOrientationEventIOS;

      let next: number | null = null;
      if (typeof e.webkitCompassHeading === 'number') {
        // Safari already gives true-north clockwise degrees.
        next = e.webkitCompassHeading;
      } else if (e.absolute && typeof e.alpha === 'number') {
        // alpha counts counter-clockwise from north, so invert it.
        next = (360 - e.alpha) % 360;
      }
      if (next === null || Number.isNaN(next)) return;

      // Low-pass filter across the 0/360 seam.
      const prev = smoothed.current;
      if (prev === null) {
        smoothed.current = next;
      } else {
        let delta = ((next - prev + 540) % 360) - 180;
        delta *= 0.2;
        smoothed.current = (prev + delta + 360) % 360;
      }
      setHeading(smoothed.current);
    };

    window.addEventListener('deviceorientationabsolute', handle);
    window.addEventListener('deviceorientation', handle);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handle);
      window.removeEventListener('deviceorientation', handle);
    };
  }, [enabled, permission]);

  useEffect(() => {
    if (!enabled) smoothed.current = null;
  }, [enabled]);

  return { heading, permission, requestAccess };
}
