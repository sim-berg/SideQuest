import { useEffect, useState } from 'react';
import type { XpResult } from '../../types/dragon';

interface XpToastProps {
  xpResult: XpResult;
  onDone: () => void;
}

export default function XpToast({ xpResult, onDone }: XpToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const { xpAwarded, bonusBreakdown } = xpResult;

  return (
    <div
      className={`fixed top-20 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="rounded-2xl bg-indigo-600 px-6 py-4 text-white shadow-2xl">
        <p className="text-center text-2xl font-bold">+{xpAwarded} XP</p>
        <div className="mt-2 space-y-0.5 text-center text-xs opacity-80">
          <p>Basis: {bonusBreakdown.baseXp} XP</p>
          {bonusBreakdown.firstOfDayBonus > 0 && (
            <p>Tagesbonus: +{bonusBreakdown.firstOfDayBonus} XP</p>
          )}
          {bonusBreakdown.streak > 1 && (
            <p>
              Streak x{bonusBreakdown.streak} ({Math.round((bonusBreakdown.streakMultiplier - 1) * 100)}% Bonus)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
