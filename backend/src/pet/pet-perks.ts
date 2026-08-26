/**
 * Perks: permanent boni a pet (and thereby its human) earns by finishing
 * quest chains. Effects hook into the existing bonus pipelines: xpBoost joins
 * the treasure XP multiplier, treasureSenseMeters extends the chest pickup
 * radius.
 */
export interface PerkDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  effects: {
    /** Extra XP as a fraction (0.05 = +5%). */
    xpBoost?: number;
    /** Extra treasure collect radius in meters. */
    treasureSenseMeters?: number;
  };
}

export const PERKS: Record<string, PerkDef> = {
  spuersinn: {
    id: 'spuersinn',
    name: 'Spürsinn',
    description: 'Dein Gefährte wittert Schätze — +50 m Sammelradius.',
    emoji: '👃',
    effects: { treasureSenseMeters: 50 },
  },
  funkenherz: {
    id: 'funkenherz',
    name: 'Funkenherz',
    description: 'Ein Funke Begeisterung bei jeder Quest — +5% XP.',
    emoji: '❤️‍🔥',
    effects: { xpBoost: 0.05 },
  },
  adlerauge: {
    id: 'adlerauge',
    name: 'Adlerauge',
    description: 'Nichts entgeht euch beiden — +50 m Schatz-Sammelradius.',
    emoji: '🦅',
    effects: { treasureSenseMeters: 50 },
  },
  glueckspfote: {
    id: 'glueckspfote',
    name: 'Glückspfote',
    description: 'Das Glück läuft euch hinterher — +5% XP.',
    emoji: '🍀',
    effects: { xpBoost: 0.05 },
  },
  wanderlust: {
    id: 'wanderlust',
    name: 'Wanderlust',
    description: 'Gemeinsam unterwegs seid ihr unermüdlich — +5% XP.',
    emoji: '🥾',
    effects: { xpBoost: 0.05 },
  },
  seelenband: {
    id: 'seelenband',
    name: 'Seelenband',
    description: 'Eure Bindung vertieft sich — +10% XP.',
    emoji: '🔗',
    effects: { xpBoost: 0.1 },
  },
};

export function sumPerkEffects(perkIds: string[]): {
  xpBoost: number;
  treasureSenseMeters: number;
} {
  let xpBoost = 0;
  let treasureSenseMeters = 0;
  for (const id of perkIds) {
    const perk = PERKS[id];
    if (!perk) continue;
    xpBoost += perk.effects.xpBoost ?? 0;
    treasureSenseMeters += perk.effects.treasureSenseMeters ?? 0;
  }
  return { xpBoost, treasureSenseMeters };
}
