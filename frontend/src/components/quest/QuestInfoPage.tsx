import type { Quest } from '../../types/quest';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useChatStore } from '../../stores/useChatStore';
import { CATEGORY_META } from '../../constants/categories';
import { formatDistance, formatReward, formatTimeRemaining } from '../../utils/format';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function QuestInfoContent({ quest }: { quest: Quest }) {
  const distance = useQuestDistance(quest.lat, quest.lng);
  const meta = CATEGORY_META[quest.category];
  const created = new Date(quest.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-0 px-5 pb-10">
      {/* Header */}
      <div className="mb-4">
        <div
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: meta.color }}
        >
          <span>{meta.icon}</span>
          {meta.label}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {quest.title}
        </h1>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {quest.description}
      </p>

      {/* Info Section */}
      <div className="mb-6 divide-y divide-slate-100 rounded-xl bg-slate-50 px-4 dark:divide-slate-700/50 dark:bg-slate-800/50">
        <InfoRow
          icon="👤"
          label="Quest Geber"
          value={quest.questGiver.name}
        />
        <InfoRow icon="📍" label="Adresse" value={quest.address} />
        {quest.reward != null && (
          <InfoRow
            icon="🏆"
            label="Belohnung"
            value={formatReward(quest.reward)}
          />
        )}
        {quest.timeLimit && (
          <InfoRow
            icon="⏰"
            label="Zeitlimit"
            value={formatTimeRemaining(quest.timeLimit)}
          />
        )}
        {distance !== null && (
          <InfoRow
            icon="🗺️"
            label="Entfernung"
            value={formatDistance(distance)}
          />
        )}
        <InfoRow icon="📅" label="Erstellt am" value={created} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button className="w-full rounded-xl bg-indigo-500 py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] active:bg-indigo-600">
          Quest annehmen
        </button>
        <button
          onClick={() => {
            useUIStore.getState().setActiveTab('chat');
          }}
          className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-base font-bold text-slate-700 transition-all active:scale-[0.98] active:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:active:bg-slate-700"
        >
          Nachricht an {quest.questGiver.name}
        </button>
      </div>
    </div>
  );
}

export default function QuestInfoPage() {
  const infoPageOpen = useUIStore((s) => s.infoPageOpen);
  const closeInfoPage = useUIStore((s) => s.closeInfoPage);
  const selectedQuest = useQuestStore((s) => s.selectedQuest);
  const selectQuest = useQuestStore((s) => s.selectQuest);

  if (!infoPageOpen || !selectedQuest) return null;

  const handleClose = () => {
    closeInfoPage();
    selectQuest(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurueck"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Quest Details
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <QuestInfoContent quest={selectedQuest} />
      </div>
    </div>
  );
}
