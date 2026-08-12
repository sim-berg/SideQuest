import { useState } from 'react';
import { motion } from 'motion/react';
import { useChainStore } from '../../stores/useChainStore';
import { usePetStore, selectActivePet } from '../../stores/usePetStore';
import { acceptChain, dismissChain } from '../../services/chain.service';
import PetAvatar from '../pet/PetAvatar';

/**
 * The pet pointing out a new detective journey: a speech-bubble card at the
 * bottom of the map while a chain offer is pending.
 */
export default function ChainOfferCard() {
  const chain = useChainStore((s) => s.chain);
  const setChain = useChainStore((s) => s.setChain);
  const openSheet = useChainStore((s) => s.openSheet);
  const pet = usePetStore((s) => selectActivePet(s));
  const [busy, setBusy] = useState(false);

  if (!chain || chain.status !== 'offered' || !pet) return null;

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setChain(await acceptChain(chain.id));
      openSheet();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await dismissChain(chain.id);
    } catch {
      /* ignore */
    } finally {
      setChain(null);
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-24 left-4 right-4 z-30 rounded-2xl border border-indigo-200 bg-white p-4 shadow-xl dark:border-indigo-500/30 dark:bg-slate-900"
    >
      <div className="flex items-start gap-3">
        <PetAvatar pet={pet} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            🔍 {chain.title}
          </p>
          <p className="mt-1 text-sm leading-snug text-slate-700 dark:text-slate-300">
            {chain.intro}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          disabled={busy}
          className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] active:bg-indigo-600"
        >
          Mitkommen!
        </button>
        <button
          onClick={dismiss}
          disabled={busy}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Nicht jetzt
        </button>
      </div>
    </motion.div>
  );
}
