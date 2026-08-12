import { useEffect } from 'react';
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
import ChatInbox from './components/chat/ChatInbox';
import ChatView from './components/chat/ChatView';
import ProfilePage from './components/profile/ProfilePage';
import CelebrationOverlay from './components/effects/CelebrationOverlay';
import DailyStreakModal from './components/effects/DailyStreakModal';
import SideQuestDetailScreen from './components/sidequest/SideQuestDetailScreen';
import QuestDetailScreen from './components/quest/QuestDetailScreen';
import RouteBanner from './components/route/RouteBanner';
import CompassView from './components/compass/CompassView';
import Toast from './components/ui/Toast';
import LogbookPage from './components/logbook/LogbookPage';
import LogbookFAB from './components/logbook/LogbookFAB';
import TreasuryPage from './components/treasure/TreasuryPage';
import TreasureFAB from './components/treasure/TreasureFAB';
import ChainOfferCard from './components/chain/ChainOfferCard';
import ChainChip from './components/chain/ChainChip';
import ChainSheet from './components/chain/ChainSheet';
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
import { fetchQuests } from './services/quest.service';
import { refreshToken } from './services/auth.service';
import { dailyCheckin } from './services/user.service';
import { getUnreadCount } from './services/message.service';
import { useChatStore } from './stores/useChatStore';
import { useStreakStore } from './stores/useStreakStore';

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

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setLoading = useQuestStore((s) => s.setLoading);
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

      {/* Chat tab */}
      {activeTab === 'chat' && <ChatInbox />}

      {/* Profile tab */}
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

      {/* Celebration animations (accept / complete / evolution / achievement) */}
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

      {/* Global toast notifications */}
      <Toast />
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
