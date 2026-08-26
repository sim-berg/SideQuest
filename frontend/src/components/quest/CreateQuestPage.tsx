import { useState, useCallback } from 'react';
import { useUIStore, type CreateWizardStep } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useMapStore } from '../../stores/useMapStore';
import { useBackDismiss } from '../../hooks/useBackDismiss';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { Category, Difficulty, GoalType } from '../../types/quest';
import type { Category as CategoryType, Difficulty as DifficultyType, GoalType as GoalTypeType } from '../../types/quest';
import { createQuest, createEventQuest } from '../../services/quest.service';
import { useCoinStore } from '../../stores/useCoinStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTrackStore } from '../../stores/useTrackStore';
import { QuestPoolPicker } from './QuestPoolPicker';
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
  const quests = useQuestStore((s) => s.quests);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setViewState = useMapStore((s) => s.setViewState);
  const openTrack = useTrackStore((s) => s.open);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [address, setAddress] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [questGiverName, setQuestGiverName] = useState('Anonym');
  const [usePseudonym, setUsePseudonym] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyType>(Difficulty.MEDIUM);
  const [goalType, setGoalType] = useState<GoalTypeType>(GoalType.PROXIMITY);
  const [goalCount, setGoalCount] = useState('');
  // Event mode: user-organized gathering with a coin-staked reward pool.
  const [isEvent, setIsEvent] = useState(false);
  const [rewardPerParticipant, setRewardPerParticipant] = useState('10');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [requiredMinutes, setRequiredMinutes] = useState('30');
  const [durationHours, setDurationHours] = useState('4');
  const [submitting, setSubmitting] = useState(false);
  const authUser = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);

  const wallet = useCoinStore((s) => s.wallet);
  const fetchWallet = useCoinStore((s) => s.fetchWallet);

  const eventPool =
    (parseInt(rewardPerParticipant, 10) || 0) *
    (parseInt(maxParticipants, 10) || 0);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setAddress('');
    setTimeLimit('');
    setQuestGiverName('Anonym');
    setDifficulty(Difficulty.MEDIUM);
    setGoalType(GoalType.PROXIMITY);
    setGoalCount('');
    setIsEvent(false);
    setRewardPerParticipant('10');
    setMaxParticipants('10');
    setRequiredMinutes('30');
    setDurationHours('4');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    closeCreateQuest();
  }, [resetForm, closeCreateQuest]);

  // Back closes the wizard (and its location-picking mode) instead of the app.
  useBackDismiss(createQuestOpen || pickingLocation, handleClose);

  const canGoNext = (step: CreateWizardStep): boolean => {
    switch (step) {
      case 1:
        return title.trim() !== '' && description.trim() !== '';
      case 2:
        return category !== null;
      case 3:
        return true; // difficulty has default
      case 4:
        if (isEvent) {
          return (
            (parseInt(rewardPerParticipant, 10) || 0) > 0 &&
            (parseInt(maxParticipants, 10) || 0) > 0 &&
            (parseInt(requiredMinutes, 10) || 0) >= 5 &&
            (parseInt(durationHours, 10) || 0) > 0 &&
            (!wallet || eventPool <= wallet.balance)
          );
        }
        return goalType !== 'count' || (goalCount.trim() !== '' && parseInt(goalCount) > 0);
      case 5:
        return address.trim() !== '';
      default:
        return false;
    }
  };

  const goNext = () => {
    if (wizardStep < 5) {
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
    if (!pickedLocation || !canGoNext(5)) return;

    setSubmitting(true);
    setError(null);

    if (isEvent) {
      try {
        const newQuest = await createEventQuest({
          title: title.trim(),
          description: description.trim(),
          lat: pickedLocation.lat,
          lng: pickedLocation.lng,
          address: address.trim(),
          category: category!,
          rewardPerParticipant: parseInt(rewardPerParticipant, 10),
          maxParticipants: parseInt(maxParticipants, 10),
          requiredMinutes: parseInt(requiredMinutes, 10),
          durationHours: parseInt(durationHours, 10),
        });
        setQuests([...quests, newQuest]);
        setViewState({
          latitude: newQuest.lat,
          longitude: newQuest.lng,
          zoom: 14,
        });
        void fetchWallet();
        resetForm();
        closeCreateQuest();
      } catch (e: any) {
        setError(
          e?.message ||
            'Event konnte nicht erstellt werden. Reichen deine Coins für den Pool?',
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const newQuest = await createQuest({
        title: title.trim(),
        description: description.trim(),
        lat: pickedLocation.lat,
        lng: pickedLocation.lng,
        address: address.trim(),
        category: category!,
        difficulty,
        goalType,
        goalCount: goalType === 'count' && goalCount ? parseInt(goalCount, 10) : null,
        questGiver: { name: questGiverName.trim() || 'Anonym' },
        ...(timeLimit !== '' && { timeLimit: new Date(timeLimit).toISOString() }),
        ...(usePseudonym && { usePseudonym: true }),
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

  // Don't show when location picking or when wizard hasn't started
  if (!createQuestOpen || pickingLocation || wizardStep === 0) return null;

  const stepTitles: Record<number, string> = {
    1: 'Was ist die Quest?',
    2: 'Kategorie waehlen',
    3: 'Schwierigkeit',
    4: 'Art des Ziels',
    5: 'Details & Absenden',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-[1200px] h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurueck"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {stepTitles[wizardStep]}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
        {/* Step indicator */}
        <div className="mb-4 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-all',
                s <= wizardStep ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700',
              )}
            />
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: Title & Description */}
        {wizardStep === 1 && (
          <div className="flex flex-col gap-4">
                {/* Quest mode: solo quest vs. coin-staked event */}
                <div className="flex gap-2">
                  {[
                    { value: false, icon: '🗺️', label: 'Quest', desc: 'Für eine Person' },
                    { value: true, icon: '🤝', label: 'Event', desc: 'Gemeinsam, mit Coin-Belohnung' },
                  ].map(({ value, icon, label, desc }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setIsEvent(value)}
                      className={cn(
                        'flex flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all',
                        isEvent === value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                      )}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span>
                        <p className={cn('text-sm font-semibold', isEvent === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200')}>
                          {label}
                        </p>
                        <p className="text-[11px] text-slate-400">{desc}</p>
                      </span>
                    </button>
                  ))}
                </div>
                {/* Pre-selection: standard quests fill the form, challenges
                    hand off to the challenge sheet. */}
                <QuestPoolPicker
                  onSelect={(sel) => {
                    setTitle(sel.title);
                    setDescription(sel.description);
                    setCategory(sel.category);
                    setDifficulty(sel.difficulty);
                  }}
                  onSelectChallenge={(slug) => openTrack(slug)}
                />
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

        {/* Step 4 (event mode): reward pool & presence settings */}
        {wizardStep === 4 && isEvent && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  🪙 Coins pro Person *
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={rewardPerParticipant}
                  onChange={(e) => setRewardPerParticipant(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  👥 Max. Teilnehmer *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  ⏱️ Anwesenheit (min) *
                </label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={requiredMinutes}
                  onChange={(e) => setRequiredMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  📅 Dauer (Stunden) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div
              className={cn(
                'rounded-xl px-4 py-3 text-sm',
                wallet && eventPool > wallet.balance
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
              )}
            >
              Du hinterlegst <strong>{eventPool} 🪙</strong> als Belohnungs-Pool
              {wallet && ` (Guthaben: ${wallet.balance} 🪙)`}. Nicht verdiente
              Coins bekommst du nach dem Event zurück.
            </div>
          </div>
        )}

        {/* Step 4: Goal Type */}
        {wizardStep === 4 && !isEvent && (
              <div className="flex flex-col gap-3">
                {[
                  { type: GoalType.PROXIMITY, icon: '📍', label: 'Standort', desc: 'Muss vor Ort abgeschlossen werden' },
                  { type: GoalType.MANUAL, icon: '✅', label: 'Selbst bestätigen', desc: 'Nutzer bestätigt selbst' },
                  { type: GoalType.COUNT, icon: '🔢', label: 'Wiederholungen', desc: 'z.B. 10 Kniebeugen' },
                ].map(({ type, icon, label, desc }) => {
                  const active = goalType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setGoalType(type as GoalTypeType)}
                      className={cn(
                        'flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all',
                        active
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                      )}
                    >
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className={cn('font-semibold', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200')}>{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </button>
                  );
                })}

                {goalType === 'count' && (
                  <div className="mt-2">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Anzahl Wiederholungen *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={goalCount}
                      onChange={(e) => setGoalCount(e.target.value)}
                      placeholder="z.B. 10"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}
          </div>
        )}

        {/* Step 5: Address & Optional fields */}
        {wizardStep === 5 && (
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
                {authUser && (
                  <button
                    type="button"
                    onClick={() => setUsePseudonym((v) => !v)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all',
                      usePseudonym
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          'font-semibold',
                          usePseudonym
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-800 dark:text-slate-200',
                        )}
                      >
                        🎭 Unter Pseudonym veröffentlichen
                      </p>
                      <p className="text-xs text-slate-400">
                        {authUser.pseudonym
                          ? `Erscheint als „${authUser.pseudonym}" — ohne Link zu deinem Profil`
                          : 'Erscheint als „Anonym" — lege im Profil ein Pseudonym fest'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                        usePseudonym ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                          usePseudonym && 'translate-x-5',
                        )}
                      />
                    </span>
                  </button>
                )}
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
          {wizardStep < 5 ? (
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
              disabled={submitting || !canGoNext(5)}
              className={cn(
                'flex-[2] rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                submitting || !canGoNext(5)
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
      </div>
    </div>
  );
}
