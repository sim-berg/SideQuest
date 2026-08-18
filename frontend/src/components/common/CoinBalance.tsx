import { useEffect } from 'react';
import { useCoinStore } from '../../stores/useCoinStore';
import { useAuthStore } from '../../stores/useAuthStore';

/** Compact wallet chip (🪙 123) shown in the top navigation. */
export default function CoinBalance() {
  const wallet = useCoinStore((s) => s.wallet);
  const fetchWallet = useCoinStore((s) => s.fetchWallet);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) void fetchWallet();
  }, [isAuthenticated, fetchWallet]);

  if (!isAuthenticated || !wallet) return null;

  return (
    <span
      className="flex items-center gap-1 rounded-full bg-amber-100/90 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-md backdrop-blur-md dark:bg-amber-500/20 dark:text-amber-300"
      title={`${wallet.balance} ${wallet.name} (${wallet.symbol})`}
    >
      <span>{wallet.emoji}</span>
      {wallet.balance}
    </span>
  );
}
