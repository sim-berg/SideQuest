import { useEffect } from 'react';
import { MapProvider } from 'react-map-gl/maplibre';
import AppShell from './components/layout/AppShell';
import QuestMap from './components/map/QuestMap';
import FilterBar from './components/filters/FilterBar';
import QuestBottomSheet from './components/quest/BottomSheet';
import QuestInfoPage from './components/quest/QuestInfoPage';
import FloatingActionButton from './components/common/FloatingActionButton';
import { useUserLocation } from './hooks/useUserLocation';
import { useQuestStore } from './stores/useQuestStore';
import { useUIStore } from './stores/useUIStore';
import { useMapStore } from './stores/useMapStore';
import { fetchQuests } from './services/quest.service';

function AppContent() {
  useUserLocation();

  const setQuests = useQuestStore((s) => s.setQuests);
  const setLoading = useQuestStore((s) => s.setLoading);
  const locationError = useMapStore((s) => s.locationError);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  useEffect(() => {
    setLoading(true);
    fetchQuests()
      .then(setQuests)
      .finally(() => setLoading(false));
  }, [setQuests, setLoading]);

  return (
    <AppShell>
      <FilterBar />
      <div className="h-full w-full pt-14">
        <QuestMap />
      </div>
      <QuestBottomSheet />
      <QuestInfoPage />
      <FloatingActionButton onClick={() => alert('Quest erstellen kommt bald!')} />

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg shadow-md backdrop-blur-md dark:bg-slate-800/80"
        aria-label="Dark Mode umschalten"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Location error banner */}
      {locationError && (
        <div className="fixed bottom-20 left-4 right-4 z-20 rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 shadow-md dark:bg-amber-900/30 dark:text-amber-300">
          Standort nicht verfuegbar - Entfernungsfilter deaktiviert
        </div>
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
}
