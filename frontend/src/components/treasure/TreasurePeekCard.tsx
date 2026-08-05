import { useState } from 'react';
import { Popup } from 'react-map-gl/maplibre';
import { Gem, MapPin, Timer } from 'lucide-react';
import { useTreasureStore } from '../../stores/useTreasureStore';
import { useToastStore } from '../../stores/useToastStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { useMapStore } from '../../stores/useMapStore';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { RARITY_META, TARGET_LABEL } from '../../constants/treasures';
import { collectTreasure } from '../../services/treasure.service';
import { formatDistance } from '../../utils/format';

const BASE_COLLECT_RADIUS_M = 100;

/**
 * Floating card above the selected treasure chest: item preview, rarity,
 * lore teaser and the collect action. Collect radius grows with carried
 * Schatz-Sinn items; the backend re-validates the distance anyway.
 */
export default function TreasurePeekCard() {
  const spawn = useTreasureStore((s) => s.selected);
  const setSelected = useTreasureStore((s) => s.setSelected);
  const removeSpawn = useTreasureStore((s) => s.removeSpawn);
  const applyCollectedEntry = useTreasureStore((s) => s.applyCollectedEntry);
  const bonuses = useTreasureStore((s) => s.inventory?.bonuses ?? null);
  const showToast = useToastStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const userLocation = useMapStore((s) => s.userLocation);
  const [loading, setLoading] = useState(false);

  const distanceKm = useQuestDistance(spawn?.lat ?? 0, spawn?.lng ?? 0);

  if (!spawn) return null;

  const meta = RARITY_META[spawn.rarity];
  const collectRadiusM = Math.min(
    BASE_COLLECT_RADIUS_M + (bonuses?.treasureSenseMeters ?? 0),
    400,
  );
  const inRange =
    distanceKm !== null && distanceKm * 1000 <= collectRadiusM;
  const minutesLeft = Math.max(
    0,
    Math.round((new Date(spawn.expiresAt).getTime() - Date.now()) / 60_000),
  );

  const handleCollect = async () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    if (!userLocation) {
      showToast('Standort nicht verfügbar');
      return;
    }
    setLoading(true);
    try {
      const result = await collectTreasure(
        spawn.id,
        userLocation.lat,
        userLocation.lng,
      );
      applyCollectedEntry(result.entry);
      removeSpawn(spawn.id);
      if (result.luckyDouble) {
        showToast(
          `🍀 Doppelfund! ${spawn.item.emoji} ${spawn.item.name} (Stufe ${result.entry.stackCount}/3)`,
        );
      } else if (result.stackFull) {
        showToast(
          `${spawn.item.emoji} ${spawn.item.name} — Stapel bereits voll (3/3)`,
        );
      } else if (result.upgraded) {
        showToast(
          `${spawn.item.emoji} ${spawn.item.name} verstärkt! Jetzt ${RARITY_META[result.entry.effectiveRarity].label} (${result.entry.stackCount}/3)`,
        );
      } else {
        showToast(`${spawn.item.emoji} ${spawn.item.name} gefunden!`);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Einsammeln fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popup
      longitude={spawn.lng}
      latitude={spawn.lat}
      anchor="bottom"
      offset={26}
      closeButton={false}
      closeOnClick={true}
      onClose={() => setSelected(null)}
      maxWidth="288px"
      className="sidequest-popup"
    >
      <div className="w-64 rounded-2xl bg-white p-3 shadow-2xl dark:bg-slate-900">
        <div className="mb-2 flex items-start gap-2">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: `${meta.color}22` }}
          >
            {spawn.item.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: meta.color }}
            >
              <Gem className="h-3 w-3" /> {meta.label}
            </span>
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {spawn.item.name}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {distanceKm !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <MapPin className="h-3 w-3" /> {formatDistance(distanceKm)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Timer className="h-3 w-3" /> {minutesLeft} min
              </span>
            </div>
          </div>
        </div>

        <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {TARGET_LABEL[spawn.item.target]}
        </p>
        <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {spawn.item.lore}
        </p>

        <button
          onClick={handleCollect}
          disabled={loading || !inRange}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: inRange ? meta.color : '#94a3b8' }}
        >
          {loading
            ? 'Wird geborgen…'
            : inRange
            ? 'Schatz bergen'
            : `Komm näher (${collectRadiusM} m)`}
        </button>
      </div>
    </Popup>
  );
}
