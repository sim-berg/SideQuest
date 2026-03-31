import { useState } from 'react';
import { useRpgStore } from '../../stores/useRpgStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { NpcDef, RpgQuest } from '../../types/rpg';
import { cn } from '../../utils/cn';

interface Props {
  npc: NpcDef;
  quests: RpgQuest[];
  onClose: () => void;
}

function QuestCard({ quest, onComplete }: { quest: RpgQuest; onComplete: (id: string) => void }) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(quest.id);
    } finally {
      setCompleting(false);
    }
  };

  const timeLeft = quest.expiresAt
    ? (() => {
        const ms = new Date(quest.expiresAt).getTime() - Date.now();
        if (ms <= 0) return null;
        const h = Math.floor(ms / 3600000);
        const d = Math.floor(h / 24);
        return d > 0 ? `${d}T ${h % 24}h` : `${h}h`;
      })()
    : null;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all',
        quest.isCompleted
          ? 'border-emerald-300/50 bg-emerald-500/10'
          : 'border-white/20 bg-white/10',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                quest.questType === 'weekly'
                  ? 'bg-purple-500/30 text-purple-200'
                  : 'bg-blue-500/30 text-blue-200',
              )}
            >
              {quest.questType === 'weekly' ? 'Wöchentlich' : 'Täglich'}
            </span>
            {quest.isCompleted && (
              <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                ✓ Erledigt
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{quest.title}</p>
          <p className="mt-0.5 text-xs text-white/70 leading-relaxed">{quest.description}</p>
          <div className="mt-2 flex items-center gap-1 rounded-lg bg-black/20 px-2 py-1.5">
            <span className="text-[10px] text-white/50">Aufgabe:</span>
            <span className="text-xs text-amber-300 font-medium">{quest.requirements}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="rounded-full bg-amber-400/20 px-2 py-1 text-center">
            <span className="text-sm font-bold text-amber-300">+{quest.xpReward}</span>
            <span className="ml-0.5 text-[10px] text-amber-400/70">XP</span>
          </div>
          {timeLeft && <span className="text-[10px] text-white/40">{timeLeft}</span>}
        </div>
      </div>

      {!quest.isCompleted && (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="mt-3 w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-amber-950 transition-all active:scale-95 disabled:opacity-60"
        >
          {completing ? 'Wird gebucht...' : 'Quest abschließen'}
        </button>
      )}
    </div>
  );
}

export default function RPGQuestModal({ npc, quests, onClose }: Props) {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const completeQuest = useRpgStore((s) => s.completeQuest);
  const lastResult = useRpgStore((s) => s.lastCompletionResult);
  const clearLastResult = useRpgStore((s) => s.clearLastResult);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const npcQuests = quests.filter((q) => q.npcId === npc.id);
  const filteredQuests = npcQuests.filter((q) => q.questType === tab);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg rounded-t-3xl pb-safe"
        style={{
          background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* XP reward banner */}
        {lastResult && (
          <div className="mx-4 mt-4 rounded-xl bg-amber-500/20 border border-amber-400/30 p-3 flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-sm font-bold text-amber-300">Quest abgeschlossen!</p>
              <p className="text-xs text-amber-400/80">
                +{lastResult.xpAwarded} XP erhalten
                {lastResult.bonusBreakdown && lastResult.bonusBreakdown.streak > 1 && (
                  <> · {lastResult.bonusBreakdown.streak}x Streak Bonus!</>
                )}
              </p>
            </div>
            <button onClick={clearLastResult} className="ml-auto text-amber-400/60 hover:text-amber-300 text-lg">✕</button>
          </div>
        )}

        {/* NPC header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {/* NPC avatar */}
          <div
            className="relative h-12 w-12 rounded-full border-2 flex items-center justify-center text-lg shrink-0"
            style={{ background: npc.bodyColor, borderColor: npc.accentColor }}
          >
            <span>🧙</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Quest-Geber</p>
            <p className="text-base font-bold text-white">{npc.name}</p>
            <p className="text-xs text-white/60 italic leading-relaxed">"{npc.greeting}"</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {!isAuthenticated && (
          <div className="mx-4 mb-4 rounded-xl bg-red-500/20 border border-red-400/30 px-3 py-2 text-sm text-red-300">
            Melde dich an, um Quests abzuschließen und XP zu verdienen.
          </div>
        )}

        {/* Tab bar */}
        <div className="flex px-4 gap-2 mb-3">
          <button
            onClick={() => setTab('daily')}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-semibold transition-all',
              tab === 'daily'
                ? 'bg-blue-500/40 text-blue-200 border border-blue-400/40'
                : 'bg-white/10 text-white/50',
            )}
          >
            Täglich
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-semibold transition-all',
              tab === 'weekly'
                ? 'bg-purple-500/40 text-purple-200 border border-purple-400/40'
                : 'bg-white/10 text-white/50',
            )}
          >
            Wöchentlich
          </button>
        </div>

        {/* Quest list */}
        <div className="flex flex-col gap-2 px-4 pb-6">
          {filteredQuests.length === 0 ? (
            <p className="text-center text-sm text-white/40 py-6">
              {npc.name} hat gerade keine {tab === 'daily' ? 'täglichen' : 'wöchentlichen'} Aufgaben.
            </p>
          ) : (
            filteredQuests.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                onComplete={isAuthenticated ? (id) => completeQuest(id) : async () => {}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
