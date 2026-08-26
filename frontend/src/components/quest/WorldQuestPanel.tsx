import { useEffect, useState } from 'react';
import { Globe2, QrCode } from 'lucide-react';
import type { Quest } from '../../types/quest';
import {
  redeemWorldQuest,
  fetchRedemptionState,
} from '../../services/quest.service';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { useCoinStore } from '../../stores/useCoinStore';
import { useToastStore } from '../../stores/useToastStore';
import { usePetStore } from '../../stores/usePetStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';

/**
 * QR redemption for a world quest (firm-organized event). The code arrives
 * by scanning the QR on site — via the device camera when the browser
 * supports BarcodeDetector, always via manual entry as fallback.
 */
export default function WorldQuestPanel({ quest }: { quest: Quest }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const fetchWallet = useCoinStore((s) => s.fetchWallet);
  const showToast = useToastStore((s) => s.showToast);
  const upsertPet = usePetStore((s) => s.upsertPet);
  const celebrate = useCelebrationStore((s) => s.celebrate);

  const [code, setCode] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canScan =
    typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRedemptionState(quest.id)
      .then((s) => setRedeemed(s.redeemed))
      .catch(() => {});
  }, [quest.id, isAuthenticated]);

  const redeem = async (value: string) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await redeemWorldQuest(quest.id, value.trim());
      setRedeemed(true);
      if (result.xpResult) upsertPet(result.xpResult.pet);
      celebrate({
        type: 'complete',
        title: quest.title,
        xpResult: result.xpResult ?? undefined,
      });
      showToast(`+${result.coins} 🪙 verdient!`);
      void fetchWallet();
    } catch (e: any) {
      setError(e?.message || 'Einlösen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  /** One camera capture → BarcodeDetector → redeem. */
  const scanWithCamera = async () => {
    setScanning(true);
    setError(null);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();

      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });

      // Poll frames for up to ~15s.
      const found: string | null = await new Promise((resolve) => {
        const deadline = Date.now() + 15_000;
        const tick = async () => {
          if (Date.now() > deadline) return resolve(null);
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) return resolve(codes[0].rawValue as string);
          } catch {
            /* frame not ready yet */
          }
          requestAnimationFrame(() => void tick());
        };
        void tick();
      });

      if (found) {
        setCode(found);
        await redeem(found);
      } else {
        setError('Kein QR-Code erkannt — gib den Code manuell ein.');
      }
    } catch {
      setError('Kamera nicht verfügbar — gib den Code manuell ein.');
    } finally {
      stream?.getTracks().forEach((t) => t.stop());
      setScanning(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/30">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-300">
        <Globe2 className="h-4 w-4" />
        Welt-Quest · {quest.questGiver.name}
      </div>

      {redeemed ? (
        <p className="text-center text-sm font-bold text-sky-600 dark:text-sky-400">
          ✅ Bereits eingelöst
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
            Scanne den QR-Code vor Ort, um {quest.reward ?? 50} 🪙 zu verdienen.
          </p>

          {error && (
            <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {canScan && (
            <button
              onClick={scanWithCamera}
              disabled={busy || scanning}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <QrCode className="h-4 w-4" />
              {scanning ? 'Suche QR-Code...' : 'QR-Code scannen'}
            </button>
          )}

          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code eingeben"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={() => void redeem(code)}
              disabled={busy || !code.trim()}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? '...' : 'Einlösen'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
