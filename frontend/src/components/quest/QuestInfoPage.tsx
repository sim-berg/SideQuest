import type { Quest } from '../../types/quest';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { CATEGORY_META } from '../../constants/categories';
import { formatDistance, formatReward, formatTimeRemaining } from '../../utils/format';
import PixelIcon from '../common/PixelIcon';

function InfoRow({
  iconId,
  label,
  value,
}: {
  iconId: number;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5">
        <PixelIcon id={iconId} size={22} alt={label} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-wood-light dark:text-wood-light">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-medieval-text dark:text-medieval-text-light">
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
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-gold/50 px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </div>
        <h1 className="font-pixel text-base leading-relaxed text-medieval-text dark:text-medieval-text-light">
          {quest.title}
        </h1>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-wood-dark dark:text-parchment">
        {quest.description}
      </p>

      {/* Info Section */}
      <div className="mb-6 divide-y divide-wood-light/20 rounded-xl border border-wood-light/30 bg-parchment px-4 dark:divide-wood/20 dark:border-wood/30 dark:bg-wood-dark/50">
        <InfoRow
          iconId={24}
          label="Quest Geber"
          value={quest.questGiver.name}
        />
        <InfoRow iconId={17} label="Adresse" value={quest.address} />
        {quest.reward != null && (
          <InfoRow
            iconId={35}
            label="Belohnung"
            value={formatReward(quest.reward)}
          />
        )}
        {quest.timeLimit && (
          <InfoRow
            iconId={27}
            label="Zeitlimit"
            value={formatTimeRemaining(quest.timeLimit)}
          />
        )}
        {distance !== null && (
          <InfoRow
            iconId={17}
            label="Entfernung"
            value={formatDistance(distance)}
          />
        )}
        <InfoRow iconId={24} label="Erstellt am" value={created} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gold bg-quest-sport py-3.5 shadow-lg transition-all active:scale-[0.98] active:brightness-90">
          <PixelIcon id={11} size={20} alt="Annehmen" />
          <span className="font-pixel text-xs text-white">Quest annehmen</span>
        </button>
        <button
          onClick={() =>
            alert(
              `Nachricht an ${quest.questGiver.name} wird gesendet... (kommt bald)`,
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-wood-light/40 bg-parchment py-3.5 transition-all active:scale-[0.98] active:bg-parchment-dark dark:border-wood/40 dark:bg-medieval-surface dark:active:bg-wood-dark"
        >
          <PixelIcon id={18} size={20} alt="Nachricht" />
          <span className="text-sm font-bold text-medieval-text dark:text-medieval-text-light">
            Nachricht an {quest.questGiver.name}
          </span>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-parchment-light dark:bg-medieval-bg">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gold/30 px-4 pt-[env(safe-area-inset-top)] pb-2 dark:border-gold-dark/30">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-medieval-text transition-colors hover:bg-parchment-dark/50 dark:text-medieval-text-light dark:hover:bg-wood-dark/50"
          aria-label="Zurueck"
        >
          <PixelIcon id={12} size={22} alt="Zurueck" />
        </button>
        <span className="font-pixel text-xs text-wood dark:text-wood-light">
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
