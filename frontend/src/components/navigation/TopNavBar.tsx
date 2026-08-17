import { useEffect, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Category } from '../../types/quest';
import { DISTANCE_OPTIONS } from '../../constants/map';
import { CATEGORY_META } from '../../constants/categories';
import { useUIStore } from '../../stores/useUIStore';
import { useFilterStore } from '../../stores/useFilterStore';
import CoinBalance from '../common/CoinBalance';
import { cn } from '../../utils/cn';
import NextQuestsSheet, { NextQuestsTrigger } from './NextQuestsSheet';

const ALL_CATEGORIES = Object.values(Category);

export default function TopNavBar() {
  const activeTab = useUIStore((s) => s.activeTab);
  const filterPanelOpen = useUIStore((s) => s.filterPanelOpen);
  const toggleFilterPanel = useUIStore((s) => s.toggleFilterPanel);
  const closeFilterPanel = useUIStore((s) => s.closeFilterPanel);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  const categories = useFilterStore((s) => s.categories);
  const toggleCategory = useFilterStore((s) => s.toggleCategory);
  const distanceKm = useFilterStore((s) => s.distanceKm);
  const setDistance = useFilterStore((s) => s.setDistance);
  const paidOnly = useFilterStore((s) => s.paidOnly);
  const timedOnly = useFilterStore((s) => s.timedOnly);
  const togglePaidOnly = useFilterStore((s) => s.togglePaidOnly);
  const toggleTimedOnly = useFilterStore((s) => s.toggleTimedOnly);

  const filterRef = useRef<HTMLDivElement>(null);

  // Close the filter panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterPanelOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        closeFilterPanel();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterPanelOpen, closeFilterPanel]);

  const activeFilterCount =
    (ALL_CATEGORIES.length - categories.length) +
    (paidOnly ? 1 : 0) +
    (timedOnly ? 1 : 0);

  if (activeTab !== 'map') return null;

  return (
    <div className="absolute top-0 right-0 left-0 z-30 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left: Filter icon */}
        <div ref={filterRef} className="relative">
          <button
            onClick={toggleFilterPanel}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-colors',
              filterPanelOpen
                ? 'bg-indigo-500 text-white'
                : 'bg-white/90 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200',
            )}
            aria-label="Filter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter panel dropdown */}
          {filterPanelOpen && (
            <div className="absolute top-12 left-0 z-40 w-80 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-lg dark:bg-slate-800/95">
              {/* Distance */}
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Entfernung
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((km) => (
                  <button
                    key={km}
                    onClick={() => setDistance(km)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                      distanceKm === km
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                    )}
                  >
                    {km} km
                  </button>
                ))}
              </div>

              {/* Categories */}
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Kategorien
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const active = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                        active
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
                      )}
                      style={active ? { backgroundColor: meta.color } : undefined}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Toggles */}
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Optionen
              </p>
              <div className="flex gap-2">
                <button
                  onClick={togglePaidOnly}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    paidOnly
                      ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
                  )}
                >
                  Bezahlt
                </button>
                <button
                  onClick={toggleTimedOnly}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    timedOnly
                      ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
                  )}
                >
                  Zeitlimit
                </button>
              </div>

              {/* Appearance — lives here since the top-right menu is gone */}
              <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Darstellung
              </p>
              <button
                onClick={toggleDarkMode}
                className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <span className="flex items-center gap-2">
                  {darkMode ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  Dark Mode
                </span>
                <span
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    darkMode ? 'bg-indigo-500' : 'bg-slate-300',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      darkMode && 'translate-x-5',
                    )}
                  />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Logo / Title — doubles as the top sheet handle */}
        <NextQuestsTrigger />

        {/* Right: wallet balances the filter button */}
        <CoinBalance />
      </div>

      {/* Top sheet: nearest quests as cards */}
      <NextQuestsSheet />
    </div>
  );
}
