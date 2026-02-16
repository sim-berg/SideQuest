import { useState, useRef, useEffect } from 'react';
import { Category } from '../../types/quest';
import { useFilterStore } from '../../stores/useFilterStore';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { fetchQuests } from '../../services/quest.service';
import PixelIcon from '../common/PixelIcon';
import CategoryChip from './CategoryChip';
import DistanceSelect from './DistanceSelect';
import ToggleFilter from './ToggleFilter';

const ALL_CATEGORIES = Object.values(Category);

export default function FilterBar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const paidOnly = useFilterStore((s) => s.paidOnly);
  const timedOnly = useFilterStore((s) => s.timedOnly);
  const togglePaidOnly = useFilterStore((s) => s.togglePaidOnly);
  const toggleTimedOnly = useFilterStore((s) => s.toggleTimedOnly);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setLoading = useQuestStore((s) => s.setLoading);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleRefresh = () => {
    setLoading(true);
    fetchQuests()
      .then(setQuests)
      .finally(() => setLoading(false));
  };

  return (
    <div ref={panelRef} className="absolute top-0 right-0 left-0 z-10 pt-[env(safe-area-inset-top)]">
      {/* Top bar */}
      <div className="neon-strip flex items-center justify-between bg-cyber-light-panel/85 px-3 py-2 backdrop-blur-xl dark:bg-cyber-surface/85">
        {/* Left: filter toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-90 ${open ? 'bg-neon-cyan/15 neon-glow-cyan' : 'hover:bg-neon-cyan/10'}`}
          aria-label="Filter"
        >
          <PixelIcon id={17} size={26} alt="Filter" />
        </button>

        {/* Center: dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-neon-magenta/10 active:scale-90"
          aria-label="Dark Mode umschalten"
        >
          <div className="text-xl">{darkMode ? '☀' : '🌙'}</div>
        </button>

        {/* Right: refresh */}
        <button
          onClick={handleRefresh}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-neon-cyan/10 active:scale-90"
          aria-label="Aktualisieren"
        >
          <PixelIcon id={14} size={26} alt="Aktualisieren" />
        </button>
      </div>

      {/* Filter dropdown */}
      {open && (
        <div className="neon-strip-vertical relative border-b border-neon-cyan/20 bg-cyber-light-panel/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-neon-cyan/15 dark:bg-cyber-panel/95">
          {/* Categories */}
          <p className="mb-2 font-pixel text-[10px] tracking-widest text-cyber-light-text-dim uppercase dark:text-cyber-text-dim">
            Kategorie
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <CategoryChip key={cat} category={cat} />
            ))}
          </div>

          {/* Distance + toggles */}
          <p className="mb-2 font-pixel text-[10px] tracking-widest text-cyber-light-text-dim uppercase dark:text-cyber-text-dim">
            Entfernung & Filter
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DistanceSelect />
            <ToggleFilter label="Bezahlt" active={paidOnly} onToggle={togglePaidOnly} />
            <ToggleFilter label="Zeitlimit" active={timedOnly} onToggle={toggleTimedOnly} />
          </div>
        </div>
      )}
    </div>
  );
}
