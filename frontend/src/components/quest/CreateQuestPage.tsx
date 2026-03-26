import { useState, useCallback } from 'react';
import { Sheet } from 'react-modal-sheet';
import { useUIStore, type CreateWizardStep } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useMapStore } from '../../stores/useMapStore';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { Category, Difficulty } from '../../types/quest';
import type { Category as CategoryType, Difficulty as DifficultyType } from '../../types/quest';
import { createQuest } from '../../services/quest.service';
import { cn } from '../../utils/cn';

const ALL_CATEGORIES = Object.values(Category);
const ALL_DIFFICULTIES: DifficultyType[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

export default function CreateQuestPage() {
  const createQuestOpen = useUIStore((s) => s.createQuestOpen);
  const pickingLocation = useUIStore((s) => s.pickingLocation);
  const wizardStep = useUIStore((s) => s.createWizardStep);
  const setWizardStep = useUIStore((s) => s.setCreateWizardStep);
  const pickedLocation = useUIStore((s) => s.pickedLocation);
  const closeCreateQuest = useUIStore((s) => s.closeCreateQuest);
  const darkMode = useUIStore((s) => s.darkMode);
  const quests = useQuestStore((s) => s.quests);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setViewState = useMapStore((s) => s.setViewState);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [address, setAddress] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [questGiverName, setQuestGiverName] = useState('Anonym');
  const [difficulty, setDifficulty] = useState<DifficultyType>(Difficulty.MEDIUM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setAddress('');
    setTimeLimit('');
    setQuestGiverName('Anonym');
    setDifficulty(Difficulty.MEDIUM);
    setError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    closeCreateQuest();
  };

  const canGoNext = (step: CreateWizardStep): boolean => {
    switch (step) {
      case 1:
        return title.trim() !== '' && description.trim() !== '';
      case 2:
        return category !== null;
      case 3:
        return true; // difficulty has default
      case 4:
        return address.trim() !== '';
      default:
        return false;
    }
  };

  const goNext = () => {
    if (wizardStep < 4) {
      setWizardStep((wizardStep + 1) as CreateWizardStep);
    }
  };

  const goBack = () => {
    if (wizardStep > 1) {
      setWizardStep((wizardStep - 1) as CreateWizardStep);
    } else {
      handleClose();
    }
  };

  const handleSubmit = async () => {
    if (!pickedLocation || !canGoNext(4)) return;

    setSubmitting(true);
    setError(null);

    try {
      const newQuest = await createQuest({
        title: title.trim(),
        description: description.trim(),
        lat: pickedLocation.lat,
        lng: pickedLocation.lng,
        address: address.trim(),
        category: category!,
        difficulty,
        questGiver: { name: questGiverName.trim() || 'Anonym' },
        ...(timeLimit !== '' && { timeLimit: new Date(timeLimit).toISOString() }),
      });

      setQuests([...quests, newQuest]);
      setViewState({
        latitude: newQuest.lat,
        longitude: newQuest.lng,
        zoom: 14,
      });
      resetForm();
      closeCreateQuest();
    } catch {
      setError('Quest konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show sheets during location picking or when wizard hasn't started
  if (!createQuestOpen || pickingLocation || wizardStep === 0) return null;

  const bg = darkMode ? '#0f172a' : '#ffffff';
  const isSheetOpen = wizardStep >= 1;

  const stepTitles: Record<number, string> = {
    1: 'Was ist die Quest?',
    2: 'Kategorie waehlen',
    3: 'Schwierigkeit',
    4: 'Details & Absenden',
  };

  return (
    <Sheet
      isOpen={isSheetOpen}
      onClose={handleClose}
      detent="content-height"
    >
      <Sheet.Container
        style={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
          backgroundColor: bg,
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Sheet.Header style={{ backgroundColor: bg }} />
        <Sheet.Content style={{ backgroundColor: bg }}>
          <div className="px-5 pb-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            {/* Step indicator */}
            <div className="mb-4 flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all',
                    s <= wizardStep ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />
              ))}
            </div>

            {/* Step title */}
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
              {stepTitles[wizardStep]}
            </h2>

            {/* Error banner */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Step 1: Title & Description */}
            {wizardStep === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Parkour im Mauerpark"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Beschreibung *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beschreibe die Quest..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Category */}
            {wizardStep === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {ALL_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all',
                        active
                          ? 'border-transparent text-white shadow-lg'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                      )}
                      style={active ? { backgroundColor: meta.color } : undefined}
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <span className="text-sm font-semibold">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Difficulty */}
            {wizardStep === 3 && (
              <div className="flex flex-col gap-3">
                {ALL_DIFFICULTIES.map((diff) => {
                  const dmeta = DIFFICULTY_META[diff];
                  const active = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border-2 px-5 py-4 transition-all',
                        active
                          ? 'border-transparent text-white shadow-lg'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                      )}
                      style={active ? { backgroundColor: dmeta.color } : undefined}
                    >
                      <span className="text-base font-semibold">{dmeta.label}</span>
                      <span className={cn('text-sm font-medium', active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500')}>
                        {dmeta.xp} XP
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 4: Address & Optional fields */}
            {wizardStep === 4 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Adresse / Ortsname *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="z.B. Mauerpark, Berlin"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
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
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={goBack}
                className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 transition-all active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200"
              >
                Zurueck
              </button>
              {wizardStep < 4 ? (
                <button
                  onClick={goNext}
                  disabled={!canGoNext(wizardStep)}
                  className={cn(
                    'flex-[2] rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                    canGoNext(wizardStep)
                      ? 'bg-indigo-500 shadow-indigo-500/30'
                      : 'cursor-not-allowed bg-slate-300 shadow-none dark:bg-slate-600',
                  )}
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canGoNext(4)}
                  className={cn(
                    'flex-[2] rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                    submitting || !canGoNext(4)
                      ? 'cursor-not-allowed bg-slate-300 shadow-none dark:bg-slate-600'
                      : 'bg-indigo-500 shadow-indigo-500/30',
                  )}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Erstelle...
                    </span>
                  ) : (
                    'Quest erstellen'
                  )}
                </button>
              )}
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={handleClose} />
    </Sheet>
  );
}
