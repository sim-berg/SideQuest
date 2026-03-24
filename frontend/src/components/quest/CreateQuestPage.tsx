import { useState, useCallback } from 'react';
import Map, { Marker, type MarkerDragEvent } from 'react-map-gl/maplibre';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useMapStore } from '../../stores/useMapStore';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { MAP_STYLE_LIGHT, MAP_STYLE_DARK } from '../../constants/map';
import { Category, Difficulty } from '../../types/quest';
import type { Category as CategoryType, Difficulty as DifficultyType } from '../../types/quest';
import { createQuest } from '../../services/quest.service';
import { cn } from '../../utils/cn';

const ALL_CATEGORIES = Object.values(Category);
const ALL_DIFFICULTIES: DifficultyType[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

export default function CreateQuestPage() {
  const createQuestOpen = useUIStore((s) => s.createQuestOpen);
  const closeCreateQuest = useUIStore((s) => s.closeCreateQuest);
  const darkMode = useUIStore((s) => s.darkMode);
  const quests = useQuestStore((s) => s.quests);
  const setQuests = useQuestStore((s) => s.setQuests);
  const userLocation = useMapStore((s) => s.userLocation);
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [address, setAddress] = useState('');
  const [reward, setReward] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [questGiverName, setQuestGiverName] = useState('Anonym');
  const [difficulty, setDifficulty] = useState<DifficultyType>(Difficulty.MEDIUM);
  const [pinLat, setPinLat] = useState(
    userLocation?.lat ?? viewState.latitude,
  );
  const [pinLng, setPinLng] = useState(
    userLocation?.lng ?? viewState.longitude,
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const canSubmit =
    title.trim() !== '' &&
    description.trim() !== '' &&
    category !== null &&
    address.trim() !== '';

  const handleDragEnd = useCallback((e: MarkerDragEvent) => {
    setPinLat(e.lngLat.lat);
    setPinLng(e.lngLat.lng);
  }, []);

  const handleSubmit = async () => {
    setAttempted(true);
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const newQuest = await createQuest({
        title: title.trim(),
        description: description.trim(),
        lat: pinLat,
        lng: pinLng,
        address: address.trim(),
        category: category!,
        difficulty,
        questGiver: { name: questGiverName.trim() || 'Anonym' },
        ...(reward !== '' && { reward: Number(reward) }),
        ...(timeLimit !== '' && { timeLimit: new Date(timeLimit).toISOString() }),
      });

      setQuests([...quests, newQuest]);
      setViewState({
        latitude: newQuest.lat,
        longitude: newQuest.lng,
        zoom: 14,
      });
      closeCreateQuest();
    } catch {
      setError('Quest konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!createQuestOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={closeCreateQuest}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurueck"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Neue Quest erstellen
        </span>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-5 pb-10">
          {/* Error banner */}
          {error && (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Parkour im Mauerpark"
              className={cn(
                'w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                attempted && title.trim() === ''
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            />
            {attempted && title.trim() === '' && (
              <p className="mt-1 text-xs text-red-500">Titel ist erforderlich</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Beschreibung *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe die Quest..."
              className={cn(
                'w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                attempted && description.trim() === ''
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            />
            {attempted && description.trim() === '' && (
              <p className="mt-1 text-xs text-red-500">
                Beschreibung ist erforderlich
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Kategorie *
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                      active
                        ? 'border-transparent text-white shadow-md'
                        : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
                    )}
                    style={active ? { backgroundColor: meta.color } : undefined}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            {attempted && category === null && (
              <p className="mt-1 text-xs text-red-500">
                Kategorie ist erforderlich
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Schwierigkeit
            </label>
            <div className="flex gap-2">
              {ALL_DIFFICULTIES.map((diff) => {
                const dmeta = DIFFICULTY_META[diff];
                const active = difficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all',
                      active
                        ? 'border-transparent text-white shadow-md'
                        : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
                    )}
                    style={active ? { backgroundColor: dmeta.color } : undefined}
                  >
                    {dmeta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Standort *
            </label>
            <div className="h-[200px] overflow-hidden rounded-xl">
              <Map
                id="create-quest-map"
                initialViewState={{
                  latitude: pinLat,
                  longitude: pinLng,
                  zoom: 14,
                }}
                mapStyle={darkMode ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
              >
                <Marker
                  latitude={pinLat}
                  longitude={pinLng}
                  draggable
                  onDragEnd={handleDragEnd}
                >
                  <div className="text-3xl">📍</div>
                </Marker>
              </Map>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse eingeben"
              className={cn(
                'mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                attempted && address.trim() === ''
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            />
            {attempted && address.trim() === '' && (
              <p className="mt-1 text-xs text-red-500">
                Adresse ist erforderlich
              </p>
            )}
          </div>

          {/* Reward */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Belohnung
            </label>
            <input
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="XP Belohnung (optional)"
              min={0}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Time limit */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Zeitlimit (optional)
            </label>
            <input
              type="datetime-local"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Quest giver name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Quest Geber
            </label>
            <input
              type="text"
              value={questGiverName}
              onChange={(e) => setQuestGiverName(e.target.value)}
              placeholder="Dein Name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              'w-full rounded-xl py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]',
              submitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-500 active:bg-indigo-600',
            )}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Erstelle Quest...
              </span>
            ) : (
              'Quest erstellen'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
