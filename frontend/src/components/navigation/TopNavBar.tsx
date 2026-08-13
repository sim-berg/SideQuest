import { useEffect, useRef } from 'react';
import { Category } from '../../types/quest';
import { DISTANCE_OPTIONS } from '../../constants/map';
import { CATEGORY_META } from '../../constants/categories';
import { useUIStore } from '../../stores/useUIStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useChatStore } from '../../stores/useChatStore';
import CoinBalance from '../common/CoinBalance';
import { cn } from '../../utils/cn';

const ALL_CATEGORIES = Object.values(Category);

export default function TopNavBar() {
  const activeTab = useUIStore((s) => s.activeTab);
  const filterPanelOpen = useUIStore((s) => s.filterPanelOpen);
  const toggleFilterPanel = useUIStore((s) => s.toggleFilterPanel);
  const closeFilterPanel = useUIStore((s) => s.closeFilterPanel);
  const menuOpen = useUIStore((s) => s.menuOpen);
  const toggleMenu = useUIStore((s) => s.toggleMenu);
  const closeMenu = useUIStore((s) => s.closeMenu);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const totalUnread = useChatStore((s) => s.totalUnread);

  const categories = useFilterStore((s) => s.categories);
  const toggleCategory = useFilterStore((s) => s.toggleCategory);
  const distanceKm = useFilterStore((s) => s.distanceKm);
  const setDistance = useFilterStore((s) => s.setDistance);
  const paidOnly = useFilterStore((s) => s.paidOnly);
  const timedOnly = useFilterStore((s) => s.timedOnly);
  const togglePaidOnly = useFilterStore((s) => s.togglePaidOnly);
  const toggleTimedOnly = useFilterStore((s) => s.toggleTimedOnly);

  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
      if (filterPanelOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        closeFilterPanel();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen, filterPanelOpen, closeMenu, closeFilterPanel]);

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
            </div>
          )}
        </div>

        {/* Center: Logo / Title + wallet */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800 drop-shadow-sm dark:text-white">
            SideQuest
          </h1>
          <CoinBalance />
        </div>

        {/* Right: Menu dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={toggleMenu}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-colors',
              menuOpen
                ? 'bg-indigo-500 text-white'
                : 'bg-white/90 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200',
            )}
            aria-label="Menu"
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {/* Menu dropdown */}
          {menuOpen && (
            <div className="absolute top-12 right-0 z-40 w-48 overflow-hidden rounded-2xl bg-white/95 shadow-xl backdrop-blur-lg dark:bg-slate-800/95">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  closeMenu();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
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
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                Profil
              </button>
              <div className="mx-3 border-t border-slate-100 dark:border-slate-700" />
              <button
                onClick={() => {
                  setActiveTab('chat');
                  closeMenu();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
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
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
                Chat
                {totalUnread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>
              <div className="mx-3 border-t border-slate-100 dark:border-slate-700" />
              <button
                onClick={toggleDarkMode}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
