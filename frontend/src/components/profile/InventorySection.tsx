import { useState } from 'react';
import type { InventoryWeapon, InventoryArmor, InventoryEffect, ItemRarity } from '../../types/inventory';
import { WEAPON_UNLOCKS, ARMOR_UNLOCKS } from '../../constants/inventory';

const RARITY_COLOR: Record<ItemRarity, { text: string; bg: string; border: string }> = {
  common:    { text: '#8a9aaa', bg: 'rgba(100,120,140,0.08)', border: 'rgba(100,120,140,0.2)' },
  uncommon:  { text: '#40b060', bg: 'rgba(40,160,80,0.08)',  border: 'rgba(40,160,80,0.2)'  },
  rare:      { text: '#4080e0', bg: 'rgba(60,100,220,0.08)', border: 'rgba(60,100,220,0.2)' },
  legendary: { text: '#e0a000', bg: 'rgba(220,140,0,0.08)',  border: 'rgba(220,140,0,0.2)'  },
};
const RARITY_LABEL: Record<ItemRarity, string> = {
  common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', legendary: 'Legendär',
};
const SOURCE_LABEL: Record<string, string> = {
  chest_common: 'Holzkiste', chest_rare: 'Seltene Kiste',
  chest_legendary: 'Legendäre Kiste', level_up: 'Level-Aufstieg', quest: 'Quest',
};
const EFFECT_ICON: Record<string, string> = {
  glow: '✨', particle: '🌟', trail: '💫', aura: '🔮', enchant: '⚡',
};
const STAT_LABEL: Record<string, string> = {
  dmg: 'Schaden', range: 'Reichweite', cooldown: 'Geschwindigkeit', defense: 'Verteidigung',
};

type Tab = 'weapons' | 'armor' | 'effects';

interface Props {
  weapons: InventoryWeapon[];
  armor:   InventoryArmor[];
  effects: InventoryEffect[];
  userLevel: number;
  onApplyEffect:  (targetType: 'weapon' | 'armor', targetId: string, effectId: string) => void;
  onRemoveEffect: (targetType: 'weapon' | 'armor', targetId: string, effectId: string) => void;
}

export default function InventorySection({ weapons, armor, effects, userLevel, onApplyEffect, onRemoveEffect }: Props) {
  const [tab, setTab] = useState<Tab>('weapons');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Inventar</h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {weapons.length} Waffen · {armor.length} Rüstungen · {effects.length} Effekte
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['weapons', 'armor', 'effects'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedId(null); }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
              tab === t
                ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {t === 'weapons' ? 'Waffen' : t === 'armor' ? 'Rüstung' : 'Effekte'}
          </button>
        ))}
      </div>

      {tab === 'weapons' && (
        <WeaponsTab
          weapons={weapons} effects={effects} userLevel={userLevel}
          selectedId={selectedId} setSelectedId={setSelectedId}
          onApplyEffect={onApplyEffect} onRemoveEffect={onRemoveEffect}
        />
      )}
      {tab === 'armor' && (
        <ArmorTab
          armor={armor} effects={effects} userLevel={userLevel}
          selectedId={selectedId} setSelectedId={setSelectedId}
          onApplyEffect={onApplyEffect} onRemoveEffect={onRemoveEffect}
        />
      )}
      {tab === 'effects' && (
        <EffectsTab effects={effects} weapons={weapons} armor={armor} />
      )}
    </div>
  );
}

// ── Weapons tab ───────────────────────────────────────────────────────────────

function WeaponsTab({ weapons, effects, userLevel, selectedId, setSelectedId, onApplyEffect, onRemoveEffect }: {
  weapons: InventoryWeapon[]; effects: InventoryEffect[]; userLevel: number;
  selectedId: string | null; setSelectedId: (id: string | null) => void;
  onApplyEffect: Props['onApplyEffect']; onRemoveEffect: Props['onRemoveEffect'];
}) {
  // Show owned weapons + locked previews
  const lockedUnlocks = WEAPON_UNLOCKS.filter((u) => u.requiredLevel > userLevel);

  return (
    <div className="flex flex-col gap-2">
      {/* Owned */}
      {weapons.map((w) => {
        const rc = RARITY_COLOR[w.rarity];
        const isSelected = selectedId === w.id;
        const totalDmgBonus = w.upgrades.filter((u) => u.stat === 'dmg').reduce((s, u) => s + u.value, 0);
        return (
          <div key={w.id}>
            <button
              onClick={() => setSelectedId(isSelected ? null : w.id)}
              className="w-full rounded-xl p-3 text-left transition-all active:scale-[0.99]"
              style={{ background: rc.bg, border: `1px solid ${rc.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ background: 'rgba(0,0,0,0.06)', border: `1px solid ${rc.border}` }}>
                  ⚔️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: rc.text }}>{w.name}</p>
                  <p className="text-xs text-slate-400 truncate">{w.description}</p>
                  {w.upgrades.length > 0 && (
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      {w.upgrades.map((u) => `+${u.stat === 'cooldown' ? Math.abs(u.value) : u.value} ${STAT_LABEL[u.stat]}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] font-medium" style={{ color: rc.text }}>{RARITY_LABEL[w.rarity]}</p>
                  {totalDmgBonus > 0 && <p className="text-[10px] text-emerald-400">+{totalDmgBonus} Schaden</p>}
                  {w.appliedEffects.length > 0 && (
                    <p className="text-[10px] text-indigo-400">{w.appliedEffects.length} Effekt{w.appliedEffects.length > 1 ? 'e' : ''}</p>
                  )}
                </div>
              </div>
            </button>
            {isSelected && (
              <EffectEditor
                appliedEffects={w.appliedEffects} allEffects={effects}
                targetType="weapon" targetId={w.id}
                source={w.source} obtainedAt={w.obtainedAt}
                onApply={onApplyEffect} onRemove={onRemoveEffect}
              />
            )}
          </div>
        );
      })}

      {/* Locked previews */}
      {lockedUnlocks.map((u) => (
        <div key={u.templateId} className="flex items-center gap-3 rounded-xl p-3 opacity-50"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px dashed rgba(100,100,100,0.2)' }}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(100,100,100,0.15)' }}>
            🔒
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{u.templateId}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Freischalten ab Level {u.requiredLevel}</p>
          </div>
        </div>
      ))}

      {weapons.length === 0 && lockedUnlocks.length === 0 && <EmptyState text="Noch keine Waffen." />}
    </div>
  );
}

// ── Armor tab ─────────────────────────────────────────────────────────────────

function ArmorTab({ armor, effects, userLevel, selectedId, setSelectedId, onApplyEffect, onRemoveEffect }: {
  armor: InventoryArmor[]; effects: InventoryEffect[]; userLevel: number;
  selectedId: string | null; setSelectedId: (id: string | null) => void;
  onApplyEffect: Props['onApplyEffect']; onRemoveEffect: Props['onRemoveEffect'];
}) {
  const lockedUnlocks = ARMOR_UNLOCKS.filter((u) => u.requiredLevel > userLevel);

  return (
    <div className="flex flex-col gap-2">
      {armor.map((a) => {
        const rc = RARITY_COLOR[a.rarity];
        const isSelected = selectedId === a.id;
        const totalDefBonus = a.upgrades.filter((u) => u.stat === 'defense').reduce((s, u) => s + u.value, 0);
        return (
          <div key={a.id}>
            <button
              onClick={() => setSelectedId(isSelected ? null : a.id)}
              className="w-full rounded-xl p-3 text-left transition-all active:scale-[0.99]"
              style={{ background: rc.bg, border: `1px solid ${rc.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ background: 'rgba(0,0,0,0.06)', border: `1px solid ${rc.border}` }}>
                  🛡️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: rc.text }}>{a.name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.description}</p>
                  {a.upgrades.length > 0 && (
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      {a.upgrades.map((u) => `+${u.value} ${STAT_LABEL[u.stat]}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] font-medium" style={{ color: rc.text }}>{RARITY_LABEL[a.rarity]}</p>
                  <p className="text-[10px] text-slate-400">{a.baseDefense + totalDefBonus} DEF</p>
                  {a.appliedEffects.length > 0 && (
                    <p className="text-[10px] text-indigo-400">{a.appliedEffects.length} Effekt{a.appliedEffects.length > 1 ? 'e' : ''}</p>
                  )}
                </div>
              </div>
            </button>
            {isSelected && (
              <EffectEditor
                appliedEffects={a.appliedEffects} allEffects={effects}
                targetType="armor" targetId={a.id}
                source={a.source} obtainedAt={a.obtainedAt}
                onApply={onApplyEffect} onRemove={onRemoveEffect}
              />
            )}
          </div>
        );
      })}

      {lockedUnlocks.map((u) => (
        <div key={u.templateId} className="flex items-center gap-3 rounded-xl p-3 opacity-50"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px dashed rgba(100,100,100,0.2)' }}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(100,100,100,0.15)' }}>
            🔒
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{u.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Freischalten ab Level {u.requiredLevel} · {u.baseDefense} Basis-DEF</p>
          </div>
        </div>
      ))}

      {armor.length === 0 && lockedUnlocks.length === 0 && <EmptyState text="Noch keine Rüstung." />}
    </div>
  );
}

// ── Effects tab ───────────────────────────────────────────────────────────────

function EffectsTab({ effects, weapons, armor }: { effects: InventoryEffect[]; weapons: InventoryWeapon[]; armor: InventoryArmor[] }) {
  if (effects.length === 0) {
    return <EmptyState text="Noch keine Effekte. Finde sie in Kisten oder durch Level-Aufstiege." />;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {effects.map((eff) => {
        const rc = RARITY_COLOR[eff.rarity];
        const usedOnWeapons = weapons.filter((w) => w.appliedEffects.includes(eff.id)).map((w) => w.name);
        const usedOnArmor   = armor.filter((a) => a.appliedEffects.includes(eff.id)).map((a) => a.name);
        const allUsed = [...usedOnWeapons, ...usedOnArmor];
        return (
          <div key={eff.id} className="rounded-xl p-3" style={{ background: rc.bg, border: `1px solid ${rc.border}` }}>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-base">{EFFECT_ICON[eff.effectType]}</span>
              <p className="text-xs font-semibold leading-tight" style={{ color: rc.text }}>{eff.name}</p>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">{eff.description}</p>
            <p className="mt-1.5 text-[10px]" style={{ color: rc.text }}>{RARITY_LABEL[eff.rarity]}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{SOURCE_LABEL[eff.source]}</p>
            {allUsed.length > 0 && (
              <p className="mt-0.5 text-[10px] text-indigo-400 truncate">↳ {allUsed.join(', ')}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared: effect editor panel ───────────────────────────────────────────────

function EffectEditor({ appliedEffects, allEffects, targetType, targetId, source, obtainedAt, onApply, onRemove }: {
  appliedEffects: string[]; allEffects: InventoryEffect[];
  targetType: 'weapon' | 'armor'; targetId: string;
  source: string; obtainedAt: string;
  onApply: Props['onApplyEffect']; onRemove: Props['onRemoveEffect'];
}) {
  return (
    <div className="mt-1 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {SOURCE_LABEL[source]} · {new Date(obtainedAt).toLocaleDateString('de-DE')}
      </p>

      {appliedEffects.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[10px] text-slate-400">Aktive Effekte</p>
          <div className="flex flex-wrap gap-1.5">
            {appliedEffects.map((eid) => {
              const eff = allEffects.find((e) => e.id === eid);
              if (!eff) return null;
              const rc = RARITY_COLOR[eff.rarity];
              return (
                <span key={eid} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                  {EFFECT_ICON[eff.effectType]} {eff.name}
                  <button onClick={() => onRemove(targetType, targetId, eid)} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {allEffects.filter((e) => !appliedEffects.includes(e.id)).length > 0 && (
        <div>
          <p className="mb-1 text-[10px] text-slate-400">Effekt anlegen</p>
          <div className="flex flex-wrap gap-1.5">
            {allEffects.filter((e) => !appliedEffects.includes(e.id)).map((eff) => {
              const rc = RARITY_COLOR[eff.rarity];
              return (
                <button key={eff.id} onClick={() => onApply(targetType, targetId, eff.id)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                  {EFFECT_ICON[eff.effectType]} {eff.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allEffects.length === 0 && <p className="text-[10px] text-slate-400">Keine Effekte im Inventar.</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{text}</p>
    </div>
  );
}
