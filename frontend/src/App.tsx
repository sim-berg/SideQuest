import { useEffect, useState } from 'react';
import { Router, Route, Switch } from 'wouter';
import { MapProvider } from 'react-map-gl/maplibre';
import AppShell from './components/layout/AppShell';
import QuestMap from './components/map/QuestMap';
import CreateQuestPage from './components/quest/CreateQuestPage';
import QuestRoute from './components/quest/QuestRoute';
import AuthPrompt from './components/auth/AuthPrompt';
import EggIntro, { hasSeenEggIntro } from './components/pet/EggIntro';
import TopNavBar from './components/navigation/TopNavBar';
import NewQuestFAB from './components/navigation/NewQuestFAB';
import ToastContainer from './components/common/ToastContainer';
import ChatInbox from './components/chat/ChatInbox';
import ChatView from './components/chat/ChatView';
import ProfilePage from './components/profile/ProfilePage';
import CelebrationOverlay from './components/effects/CelebrationOverlay';
import DailyStreakModal from './components/effects/DailyStreakModal';
import SideQuestDetailScreen from './components/sidequest/SideQuestDetailScreen';
import QuestDetailScreen from './components/quest/QuestDetailScreen';
import RouteBanner from './components/route/RouteBanner';
import CompassView from './components/compass/CompassView';
import LogbookPage from './components/logbook/LogbookPage';
import LogbookFAB from './components/logbook/LogbookFAB';
import TreasuryPage from './components/treasure/TreasuryPage';
import TreasureFAB from './components/treasure/TreasureFAB';
import ChainOfferCard from './components/chain/ChainOfferCard';
import ChainChip from './components/chain/ChainChip';
import ChainSheet from './components/chain/ChainSheet';
import PrivacyPage from './components/legal/PrivacyPage';
import ImpressumPage from './components/legal/ImpressumPage';
import { useChainStore } from './stores/useChainStore';
import { useUserLocation } from './hooks/useUserLocation';
import { useRealtimeMessages } from './hooks/useRealtimeMessages';
import { useSideQuestSpawner } from './hooks/useSideQuestSpawner';
import { useTreasureSpawner } from './hooks/useTreasureSpawner';
import { useTreasureStore } from './stores/useTreasureStore';
import { useQuestStore } from './stores/useQuestStore';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';
import { useMapStore } from './stores/useMapStore';
import { usePetStore, selectActivePet } from './stores/usePetStore';
import { useAchievementStore } from './stores/useAchievementStore';
import { useDailySideQuestStore } from './stores/useDailySideQuestStore';
import { fetchQuests, fetchDailyQuests } from './services/quest.service';
import { refreshToken } from './services/auth.service';
import { dailyCheckin } from './services/user.service';
import { getUnreadCount } from './services/message.service';
import { useChatStore } from './stores/useChatStore';
import { useStreakStore } from './stores/useStreakStore';
import { useToastStore } from './stores/useToastStore';
import { api } from './services/api';

function ChatViewWrapper() {
  const activeChat = useChatStore((s) => s.activeChat);
  if (!activeChat) return null;
  return <ChatView />;
}

function AppContent() {
  useUserLocation();
  useRealtimeMessages();
  useSideQuestSpawner();
  useTreasureSpawner();

  const [currentPage, setCurrentPage] = useState<string | null>(null);

  // Handle hash-based routing (legal pages)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentPage(hash || null);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setDailyQuests = useQuestStore((s) => s.setDailyQuests);
  const setLoading = useQuestStore((s) => s.setLoading);
  const addToast = useToastStore((s) => s.addToast);
  const locationError = useMapStore((s) => s.locationError);
  const activeTab = useUIStore((s) => s.activeTab);
  const setTotalUnread = useChatStore((s) => s.setTotalUnread);
  const fetchPets = usePetStore((s) => s.fetchPets);
  const activePet = usePetStore((s) => selectActivePet(s));
  const fetchAchievements = useAchievementStore((s) => s.fetchAchievements);
  const fetchDaily = useDailySideQuestStore((s) => s.fetchDaily);
  const fetchTreasureInventory = useTreasureStore((s) => s.fetchInventory);
  const showStreakModal = useStreakStore((s) => s.showStreakModal);

  // Silent refresh on mount — non-blocking, app works without auth
  useEffect(() => {
    refreshToken()
      .then((res) => setAuth(res.user, res.accessToken))
      .catch(() => {});
  }, [setAuth]);

  useEffect(() => {
    setLoading(true);
    fetchQuests()
      .then(setQuests)
      .finally(() => setLoading(false));
  }, [setQuests, setLoading]);

  // Fetch global daily quests and surface one as a toast on first load
  useEffect(() => {
    fetchDailyQuests()
      .then((dailyQuests) => {
        setDailyQuests(dailyQuests);

        // Show random daily quest as toast on first load
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `sidequest-daily-shown-${today}`;
        if (!localStorage.getItem(storageKey) && dailyQuests.length > 0) {
          const randomQuest =
            dailyQuests[Math.floor(Math.random() * dailyQuests.length)];
          addToast({
            type: 'quest',
            title: randomQuest.title,
            message: randomQuest.description,
            duration: 8000,
          });
          localStorage.setItem(storageKey, 'true');
        }
      })
      .catch(() => {});
  }, [setDailyQuests, addToast]);

  // Fetch unread count only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    getUnreadCount()
      .then((r) => setTotalUnread(r.count))
      .catch(() => {});
  }, [isAuthenticated, setTotalUnread]);

  // Fetch the menagerie when authenticated — the backend hands out the
  // mystery starter egg on first fetch.
  useEffect(() => {
    if (isAuthenticated) {
      void fetchPets();
    }
  }, [isAuthenticated, fetchPets]);

  // The hatched companion scouts the neighborhood for a detective journey
  // once location is known (the backend enforces the one-per-day cooldown).
  const userLocation = useMapStore((s) => s.userLocation);
  const loadChain = useChainStore((s) => s.loadChain);
  useEffect(() => {
    if (isAuthenticated && userLocation && activePet?.species) {
      void loadChain(userLocation.lat, userLocation.lng);
    }
  }, [isAuthenticated, userLocation, activePet?.species, loadChain]);

  // Load achievements + daily side quests + treasure inventory when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchAchievements();
    void fetchDaily();
    void fetchTreasureInventory();
  }, [isAuthenticated, fetchAchievements, fetchDaily, fetchTreasureInventory]);

  // Daily streak checkin — fires once per day on first open
  useEffect(() => {
    if (!isAuthenticated) return;
    dailyCheckin()
      .then((res) => {
        if (res.isNewDay) {
          showStreakModal({
            streak: res.streak,
            totalXp: res.totalXp,
            questsCompleted: res.questsCompleted,
          });
        }
      })
      .catch(() => {});
  }, [isAuthenticated, showStreakModal]);

  // One-time egg intro for users whose active companion is an unhatched egg
  const showEggIntro =
    isAuthenticated &&
    !!user &&
    !!activePet &&
    !activePet.species &&
    !hasSeenEggIntro();

  // Show legal pages if in hash route
  if (currentPage === '/datenschutz') {
    return <PrivacyPage />;
  }
  if (currentPage === '/impressum') {
    return <ImpressumPage />;
  }

  return (
    <AppShell>
      {/* Map tab - always rendered but hidden when other tabs active */}
      <div className={activeTab === 'map' ? 'h-full w-full' : 'hidden'}>
        <div className="h-full w-full">
          <QuestMap />
        </div>

        {/* Location error banner */}
        {locationError && (
          <div className="fixed bottom-20 left-4 right-4 z-20 rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 shadow-md dark:bg-amber-900/30 dark:text-amber-300">
            Standort nicht verfuegbar - Entfernungsfilter deaktiviert
          </div>
        )}

        {/* Detective journey: pending offer + running-journey chip */}
        <ChainOfferCard />
        <ChainChip />
      </div>

      {/* Bottom center controls - location sharing + legal links */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-row items-center justify-center gap-3 md:gap-6 text-xs md:text-sm font-semibold backdrop-blur-md bg-white/20 dark:bg-slate-900/20 rounded-full px-3 md:px-6 py-2 md:py-3 border border-white/30 dark:border-slate-700/30">
        {/* Location Status */}
        {isAuthenticated && user && activeTab === 'map' && (
          <button
            onClick={async () => {
              try {
                const newValue = !user.shareLocation;
                const response = await api.patch<{ shareLocation: boolean }>('/users/me', { shareLocation: newValue });
                updateUser({ shareLocation: response.shareLocation });
              } catch (error) {
                console.error('Failed to update location sharing:', error);
                addToast({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to update location sharing',
                  duration: 3000,
                });
              }
            }}
            className={`transition-colors cursor-pointer hover:opacity-80 whitespace-nowrap ${
              user.shareLocation
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            📍 <span className="hidden sm:inline">{user.shareLocation ? 'Standort aktiv' : 'Standort inaktiv'}</span>
            <span className="sm:hidden">{user.shareLocation ? 'Aktiv' : 'Inaktiv'}</span>
          </button>
        )}

        {/* Separator */}
        {isAuthenticated && user && activeTab === 'map' && (
          <span className="text-slate-400 dark:text-slate-500">•</span>
        )}

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <a href="/#/datenschutz" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <span className="hidden sm:inline">Datenschutz</span>
            <span className="sm:hidden">Daten</span>
          </a>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <a href="/#/impressum" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <span className="hidden sm:inline">Impressum</span>
            <span className="sm:hidden">Info</span>
          </a>
        </div>
      </div>

      {/* Chat tab - overlay on map */}
      {activeTab === 'chat' && <ChatInbox />}

      {/* Profile tab - overlay on map */}
      {activeTab === 'profile' && <ProfilePage />}

      <ChatViewWrapper />

      {/* Quest creation wizard (bottom sheet overlay on map) */}
      <CreateQuestPage />

      {/* Auth prompt overlay */}
      <AuthPrompt />

      {/* Mystery egg intro overlay */}
      {showEggIntro && <EggIntro />}

      {/* Detective journey story sheet */}
      <ChainSheet />

      {/* SideQuest detail screen (full page + logbook comments) */}
      <SideQuestDetailScreen />

      {/* Quest detail screen (full page + logbook comments) */}
      <QuestDetailScreen />

      {/* Shared links: /quest/:slug opens the quest's detail screen */}
      <Switch>
        <Route path="/quest/:slug" component={QuestRoute} />
      </Switch>

      {/* Active route summary (map only) + Adventure-mode compass (full screen) */}
      {activeTab === 'map' && <RouteBanner />}
      <CompassView />

      {/* Logbook overlay (XP, achievements, daily side quests) */}
      <LogbookPage />

      {/* Schatzkammer overlay (inventory + crafting) */}
      <TreasuryPage />

      {/* Celebration animations (accept / complete / evolution / achievement / hatch) */}
      <CelebrationOverlay />

      {/* Daily streak modal */}
      <DailyStreakModal />

      {/* Top Navigation */}
      <TopNavBar />

      {/* New Quest FAB */}
      <NewQuestFAB />

      {/* Logbook FAB */}
      <LogbookFAB />

      {/* Schatzkammer FAB */}
      <TreasureFAB />

      {/* Toast notifications */}
      <ToastContainer />
    </AppShell>
  );
}

export default function App() {
  return (
    <Router>
      <MapProvider>
        <AppContent />
      </MapProvider>
    </Router>
  );
}
