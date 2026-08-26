import { useChainStore } from '../../stores/useChainStore';

/** Floating chip on the map while a journey runs — tap to reopen the story. */
export default function ChainChip() {
  const chain = useChainStore((s) => s.chain);
  const sheetOpen = useChainStore((s) => s.sheetOpen);
  const openSheet = useChainStore((s) => s.openSheet);

  if (!chain || chain.status !== 'active' || sheetOpen) return null;

  const done = chain.steps.filter((s) => s.completed).length;

  return (
    <button
      onClick={openSheet}
      className="fixed left-4 top-32 z-20 flex items-center gap-2 rounded-full border border-indigo-200 bg-white/95 py-2 pl-3 pr-4 shadow-lg backdrop-blur transition-all active:scale-95 dark:border-indigo-500/30 dark:bg-slate-900/95"
    >
      <span className="text-base">🔍</span>
      <span className="max-w-[160px] truncate text-xs font-bold text-slate-800 dark:text-white">
        {chain.title}
      </span>
      <span className="text-xs font-semibold text-indigo-500">
        {done}/{chain.steps.length}
      </span>
    </button>
  );
}
