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
        <p className="text-xs font-medium text-cyber-light-text-dim dark:text-cyber-text-dim">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-cyber-light-text dark:text-cyber-text">
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
          className="mb-3 inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold"
          style={{
            color: meta.color,
            borderColor: `${meta.color}60`,
            backgroundColor: `${meta.color}15`,
          }}
        >
          {meta.label}
        </div>
        <h1 className="font-pixel text-base leading-relaxed text-cyber-light-text dark:text-cyber-text">
          {quest.title}
        </h1>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-cyber-light-text-dim dark:text-cyber-text-dim">
        {quest.description}
      </p>

      {/* Info Section */}
      <div className="mb-6 divide-y divide-cyber-light-border rounded-xl border border-cyber-light-border bg-cyber-light-card px-4 dark:divide-cyber-border dark:border-cyber-border dark:bg-cyber-card">
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
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-quest-sport bg-quest-sport/15 py-3.5 shadow-lg transition-all active:scale-[0.98]"
          style={{ boxShadow: '0 0 16px #39ff1430' }}
        >
          <PixelIcon id={11} size={20} alt="Annehmen" />
          <span className="font-pixel text-xs text-quest-sport">Quest annehmen</span>
        </button>
        <button
          onClick={() =>
            alert(
              `Nachricht an ${quest.questGiver.name} wird gesendet... (kommt bald)`,
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyber-light-border bg-cyber-light-card py-3.5 transition-all active:scale-[0.98] active:bg-cyber-light-surface dark:border-cyber-border dark:bg-cyber-card dark:active:bg-cyber-panel"
        >
          <PixelIcon id={18} size={20} alt="Nachricht" />
          <span className="text-sm font-bold text-cyber-light-text dark:text-cyber-text">
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
    <div className="fixed inset-0 z-50 flex flex-col bg-cyber-light-bg dark:bg-cyber-bg">
      {/* Top bar */}
      <div className="neon-strip flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-cyber-light-text transition-colors hover:bg-neon-cyan/10 dark:text-cyber-text"
          aria-label="Zurueck"
        >
          <PixelIcon id={12} size={22} alt="Zurueck" />
        </button>
        <span className="font-pixel text-xs tracking-wider text-cyber-light-text-dim dark:text-cyber-text-dim">
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
