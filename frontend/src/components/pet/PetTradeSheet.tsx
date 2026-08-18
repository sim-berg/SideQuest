import { useEffect, useState } from 'react';
import type { PetTrade } from '../../types/pet';
import {
  fetchMyTrades,
  createTrade,
  acceptTrade,
  declineTrade,
  cancelTrade,
} from '../../services/pet.service';
import { usePetStore } from '../../stores/usePetStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCoinStore } from '../../stores/useCoinStore';
import { useToastStore } from '../../stores/useToastStore';
import PetAvatar from './PetAvatar';

/**
 * Trading post: offer one of your pets to another adventurer for coins
 * (0 = gift) and handle incoming offers. Fullscreen sheet opened from the
 * pet card on the profile page.
 */
export default function PetTradeSheet({ onClose }: { onClose: () => void }) {
  const pets = usePetStore((s) => s.pets);
  const fetchPets = usePetStore((s) => s.fetchPets);
  const userId = useAuthStore((s) => s.user?.id);
  const fetchWallet = useCoinStore((s) => s.fetchWallet);
  const showToast = useToastStore((s) => s.showToast);

  const [trades, setTrades] = useState<PetTrade[]>([]);
  const [petId, setPetId] = useState('');
  const [toUsername, setToUsername] = useState('');
  const [price, setPrice] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = () => {
    fetchMyTrades().then(setTrades).catch(() => {});
  };
  useEffect(loadTrades, []);

  const tradablePets = pets.filter((p) => p.species);
  const incoming = trades.filter((t) => t.toUserId === userId);
  const outgoing = trades.filter((t) => t.fromUserId === userId);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await createTrade(petId, toUsername, parseInt(price, 10) || 0);
      setToUsername('');
      setPrice('0');
      setPetId('');
      showToast('Angebot verschickt');
      loadTrades();
    } catch (e: any) {
      setError(e?.message || 'Angebot fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await acceptTrade(id);
      showToast('Tausch abgeschlossen! 🎉');
      loadTrades();
      void fetchPets();
      void fetchWallet();
    } catch (e: any) {
      setError(e?.message || 'Annehmen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async (
    id: string,
    action: 'decline' | 'cancel',
  ) => {
    setBusy(true);
    setError(null);
    try {
      await (action === 'decline' ? declineTrade(id) : cancelTrade(id));
      loadTrades();
    } catch (e: any) {
      setError(e?.message || 'Aktion fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/40">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            🔄 Tauschbörse
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Schliessen"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {error && (
            <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Incoming offers */}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Für dich
          </p>
          {incoming.length === 0 ? (
            <p className="mb-4 text-xs text-slate-400">Keine offenen Angebote.</p>
          ) : (
            incoming.map((t) => (
              <div
                key={t.id}
                className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
              >
                {t.pet && <PetAvatar pet={t.pet} size={44} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.pet?.name || t.pet?.speciesName || 'Pet'}
                  </p>
                  <p className="text-xs text-slate-400">
                    von @{t.fromUsername} ·{' '}
                    {t.price > 0 ? `${t.price} 🪙` : 'Geschenk'}
                  </p>
                </div>
                <button
                  onClick={() => void handleAccept(t.id)}
                  disabled={busy}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Annehmen
                </button>
                <button
                  onClick={() => void handleResolve(t.id, 'decline')}
                  disabled={busy}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                >
                  Nein
                </button>
              </div>
            ))
          )}

          {/* Outgoing offers */}
          {outgoing.length > 0 && (
            <>
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Deine Angebote
              </p>
              {outgoing.map((t) => (
                <div
                  key={t.id}
                  className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  {t.pet && <PetAvatar pet={t.pet} size={44} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t.pet?.name || t.pet?.speciesName || 'Pet'}
                    </p>
                    <p className="text-xs text-slate-400">
                      an @{t.toUsername} ·{' '}
                      {t.price > 0 ? `${t.price} 🪙` : 'Geschenk'}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleResolve(t.id, 'cancel')}
                    disabled={busy}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                  >
                    Zurückziehen
                  </button>
                </div>
              ))}
            </>
          )}

          {/* New offer */}
          <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Pet anbieten
          </p>
          {tradablePets.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nur geschlüpfte Wesen können getauscht werden.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tradablePets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPetId(p.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all ${
                      petId === p.id
                        ? 'bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-950/50'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <PetAvatar pet={p} size={44} />
                    <span className="max-w-[64px] truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {p.name || p.speciesName}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={toUsername}
                  onChange={(e) => setToUsername(e.target.value)}
                  placeholder="An @username"
                  className="min-w-0 flex-[2] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="🪙"
                  title="Preis in Coins (0 = Geschenk)"
                  className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                onClick={() => void handleCreate()}
                disabled={busy || !petId || !toUsername.trim()}
                className="rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Angebot senden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
