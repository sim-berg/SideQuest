import { useEffect } from 'react';
import { MapProvider } from 'react-map-gl/maplibre';
import AppShell from './components/layout/AppShell';
import Navbar from './components/layout/Navbar';
import QuestMap from './components/map/QuestMap';
import FilterBar from './components/filters/FilterBar';
import QuestBottomSheet from './components/quest/BottomSheet';
import QuestInfoPage from './components/quest/QuestInfoPage';
import FloatingActionButton from './components/common/FloatingActionButton';
import { useUserLocation } from './hooks/useUserLocation';
import { useQuestStore } from './stores/useQuestStore';
import { useMapStore } from './stores/useMapStore';
import { fetchQuests } from './services/quest.service';

function AppContent() {
  useUserLocation();

  const setQuests = useQuestStore((s) => s.setQuests);
  const setLoading = useQuestStore((s) => s.setLoading);
  const locationError = useMapStore((s) => s.locationError);

  useEffect(() => {
    setLoading(true);
    fetchQuests()
      .then(setQuests)
      .finally(() => setLoading(false));
  }, [setQuests, setLoading]);

  return (
    <AppShell>
      <FilterBar />
      <div className="h-full w-full pt-14 pb-16">
        <QuestMap />
      </div>
      <QuestBottomSheet />
      <QuestInfoPage />
      <FloatingActionButton onClick={() => alert('Quest erstellen kommt bald!')} />
      <Navbar />

      {/* Location error banner */}
      {locationError && (
        <div className="fixed bottom-20 left-4 right-4 z-20 rounded-lg border border-gold bg-parchment px-4 py-2 text-center text-sm font-semibold text-medieval-text shadow-md dark:border-gold-dark dark:bg-medieval-surface dark:text-medieval-text-light">
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
