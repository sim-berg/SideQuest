import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Backpack,
  BookOpen,
  MessageSquare,
  PawPrint,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import type { ActiveTab } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { useLogbookStore } from '../../stores/useLogbookStore';
import { useTreasureStore } from '../../stores/useTreasureStore';
import { cn } from '../../utils/cn';

interface HubItem {
  id: string;
  label: string;
  icon: typeof BookOpen;
  color: string;
  /** Requires a logged-in user — otherwise the login screen opens instead. */
  protected: boolean;
  /** Tab to land on after a successful login from this entry. */
  authTab?: ActiveTab;
  badge?: number;
  soon?: boolean;
  action: () => void;
}

/**
 * Single entry point for everything that used to sit on the map as its own
 * floating button or top-bar menu. The trigger stays bottom-right, the menu
 * itself opens as a centered grid of equally sized tiles.
 */
export default function HubMenuFAB() {
  const open = useUIStore((s) => s.hubMenuOpen);
  const toggleHubMenu = useUIStore((s) => s.toggleHubMenu);
  const closeHubMenu = useUIStore((s) => s.closeHubMenu);
  const activeTab = useUIStore((s) => s.activeTab);
  const pickingLocation = useUIStore((s) => s.pickingLocation);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const openPets = useUIStore((s) => s.openPets);
  const openGuilds = useUIStore((s) => s.openGuilds);
  const openLogbook = useLogbookStore((s) => s.openLogbook);
  const openTreasury = useTreasureStore((s) => s.openTreasury);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalUnread = useChatStore((s) => s.totalUnread);

  // Escape closes the menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeHubMenu();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeHubMenu]);

  const hidden = activeTab !== 'map' || pickingLocation;

  // Keep the menu from lingering behind an overlay when the map is left
  useEffect(() => {
    if (hidden && open) closeHubMenu();
  }, [hidden, open, closeHubMenu]);

  if (hidden) return null;

  const unread = isAuthenticated ? totalUnread : 0;

  const items: HubItem[] = [
    {
      id: 'logbook',
      label: 'Logbuch',
      icon: BookOpen,
      color: '#f59e0b',
      protected: true,
      action: openLogbook,
    },
    {
      id: 'equipment',
      label: 'Ausrüstung',
      icon: Backpack,
      color: '#a855f7',
      protected: true,
      action: openTreasury,
    },
    {
      id: 'pets',
      label: 'Pets',
      icon: PawPrint,
      color: '#10b981',
      protected: true,
      action: openPets,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      color: '#0ea5e9',
      protected: true,
      authTab: 'chat',
      badge: unread,
      action: () => setActiveTab('chat'),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      color: '#6366f1',
      protected: true,
      authTab: 'profile',
      action: () => setActiveTab('profile'),
    },
    {
      id: 'guilds',
      label: 'Gilden',
      icon: Shield,
      color: '#64748b',
      protected: false,
      soon: true,
      action: openGuilds,
    },
  ];

  const handleSelect = (item: HubItem) => {
    if (item.protected && !isAuthenticated) {
      closeHubMenu();
      setShowAuthPrompt(true, item.authTab);
      return;
    }
    closeHubMenu();
    item.action();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="hub-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-30 flex items-center justify-center p-6"
          >
            {/* Scrim — tap anywhere outside to close */}
            <div
              onClick={closeHubMenu}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/60 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/90"
            >
              <div className="grid grid-cols-3 gap-2.5">
                {items.map((item, i) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: 0.03 + i * 0.03,
                      type: 'spring',
                      stiffness: 420,
                      damping: 26,
                    }}
                    className={cn(
                      'relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-2 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:border-slate-700/70 dark:bg-slate-800/70',
                      item.soon && 'opacity-70',
                    )}
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 4px 14px ${item.color}55`,
                      }}
                    >
                      <item.icon className="h-6 w-6" strokeWidth={2.2} />
                    </span>
                    <span className="w-full truncate px-0.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {item.label}
                    </span>

                    {!!item.badge && item.badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {item.soon && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[8px] font-black tracking-wide text-slate-500 uppercase dark:bg-slate-700 dark:text-slate-300">
                        Bald
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleHubMenu}
        className={cn(
          'fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-all hover:shadow-xl active:scale-95',
          open
            ? 'bg-slate-800 shadow-slate-900/30 dark:bg-slate-700'
            : 'bg-gradient-to-br from-amber-500 to-purple-600 shadow-purple-500/30',
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0, scale: open ? 0.9 : 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="flex items-center justify-center"
        >
          {open ? (
            <X className="h-7 w-7" strokeWidth={2.4} />
          ) : (
            <Sparkles className="h-7 w-7" strokeWidth={2.2} />
          )}
        </motion.span>

        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
