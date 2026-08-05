import { Rarity } from './enums/rarity.enum.js';

/**
 * DnD-style item effects. `value` semantics depend on the type:
 *  - xp_boost / dragon_xp / luck: fraction (0.05 = +5%)
 *  - treasure_sense: extra collect radius in meters
 *  - cosmetic: value unused (0), purely visual flair
 */
export type EffectType =
  | 'xp_boost'
  | 'dragon_xp'
  | 'luck'
  | 'treasure_sense'
  | 'cosmetic';

export interface ItemEffect {
  type: EffectType;
  value: number;
  /** Player-facing description of what the effect does. */
  description: string;
}

export interface TreasureItemDef {
  id: string;
  name: string;
  emoji: string;
  /** Base rarity — stacking duplicates raises the *effective* rarity. */
  rarity: Rarity;
  /** Who the item is for; drives grouping in the inventory UI. */
  target: 'player' | 'dragon' | 'cosmetic';
  effects: ItemEffect[];
  /** The item's history/lore, DnD flavor. */
  lore: string;
  /** Craft-only items never spawn in the wild. */
  craftOnly?: boolean;
}

export const TREASURE_CATALOG: TreasureItemDef[] = [
  // ── Basic ────────────────────────────────────────────────────────────────
  {
    id: 'rusty_compass',
    name: 'Rostiger Kompass',
    emoji: '🧭',
    rarity: Rarity.BASIC,
    target: 'player',
    effects: [
      {
        type: 'treasure_sense',
        value: 50,
        description: 'Schatz-Sinn: +50 m Einsammel-Reichweite für Schätze.',
      },
    ],
    lore:
      'Gehörte einst Elrik dem Zerstreuten, der damit dreimal denselben Wald ' +
      '„entdeckte“. Die Nadel zittert leicht, wenn ein Schatz in der Nähe ist.',
  },
  {
    id: 'simple_glasses',
    name: 'Schlichte Brille',
    emoji: '👓',
    rarity: Rarity.BASIC,
    target: 'cosmetic',
    effects: [
      {
        type: 'cosmetic',
        value: 0,
        description: 'Rein kosmetisch — aber ein beliebtes Bastel-Material.',
      },
    ],
    lore:
      'Standardausgabe der Gildenbibliothek von Hohenfels. Auf dem Bügel steht ' +
      'eingraviert: „Wissen ist der einzige Schatz, der sich vermehrt, wenn man ' +
      'ihn teilt.“ Schmiede munkeln, dass sich aus zwei Gläsern mehr machen lässt.',
  },
  {
    id: 'red_gem',
    name: 'Roter Splitter',
    emoji: '💎',
    rarity: Rarity.BASIC,
    target: 'cosmetic',
    effects: [
      {
        type: 'cosmetic',
        value: 0,
        description: 'Pulsiert schwach — Schmiede zahlen gut dafür.',
      },
    ],
    lore:
      'Ein Splitter aus den Glutminen von Aschfurt. Er pulsiert im Takt eines ' +
      'schlafenden Drachenherzens. In Fassungen entfaltet er erst seine Kraft.',
  },
  {
    id: 'lucky_clover',
    name: 'Glücksklee',
    emoji: '🍀',
    rarity: Rarity.BASIC,
    target: 'player',
    effects: [
      {
        type: 'luck',
        value: 0.05,
        description: 'Glück: 5% Chance, einen Schatz doppelt zu finden.',
      },
    ],
    lore:
      'Gepflückt vom Halbling Fenn Dreifinger, der beim Pflücken vom Blitz ' +
      'getroffen wurde — und unverletzt blieb. Seitdem gilt vierblättriger Klee ' +
      'aus Fenns Wiese als amtlich geprüftes Glück.',
  },
  {
    id: 'worn_boots',
    name: 'Abgewetzte Stiefel',
    emoji: '🥾',
    rarity: Rarity.BASIC,
    target: 'player',
    effects: [
      {
        type: 'xp_boost',
        value: 0.03,
        description: '+3% XP auf abgeschlossene Quests.',
      },
    ],
    lore:
      'Tausend Meilen und kein bisschen leise. Wer sie trägt, spürt den Drang, ' +
      'noch eine Straße weiterzugehen. Die Sohlen kennen Wege, die auf keiner ' +
      'Karte stehen.',
  },
  {
    id: 'dragon_treat',
    name: 'Drachenleckerli',
    emoji: '🍖',
    rarity: Rarity.BASIC,
    target: 'dragon',
    effects: [
      {
        type: 'dragon_xp',
        value: 0.03,
        description: 'Dein Drache erhält +3% XP.',
      },
    ],
    lore:
      'Nach dem Geheimrezept der Drachenamme Grisella: geräuchertes Wildbret, ' +
      'ein Hauch Schwefel, viel Liebe. Kein Drache kann widerstehen — und wer ' +
      'gut frisst, wächst schneller.',
  },
  {
    id: 'traveler_cloak',
    name: 'Reisemantel',
    emoji: '🧣',
    rarity: Rarity.BASIC,
    target: 'cosmetic',
    effects: [
      {
        type: 'cosmetic',
        value: 0,
        description: 'Rein kosmetisch — flattert dramatisch im Wind.',
      },
    ],
    lore:
      'Jeder große Held beginnt mit einem einfachen Mantel. Dieser hier hat ' +
      'schon drei Besitzer überlebt und riecht nach Lagerfeuer und Fernweh.',
  },

  // ── Uncommon ─────────────────────────────────────────────────────────────
  {
    id: 'redgem_goggles',
    name: 'Rotglas-Gucker',
    emoji: '🥽',
    rarity: Rarity.UNCOMMON,
    target: 'player',
    craftOnly: true,
    effects: [
      {
        type: 'treasure_sense',
        value: 100,
        description: 'Schatz-Sinn: +100 m Einsammel-Reichweite.',
      },
      {
        type: 'luck',
        value: 0.03,
        description: 'Glück: 3% Chance auf Doppelfund.',
      },
    ],
    lore:
      'Geschmiedet aus zwei schlichten Brillen und einem Roten Splitter. Durch ' +
      'das rote Glas schimmern vergrabene Schätze wie Glut in der Dämmerung. ' +
      'Ein Klassiker der Schatzsucher-Zunft.',
  },
  {
    id: 'owl_feather',
    name: 'Eulenfeder',
    emoji: '🪶',
    rarity: Rarity.UNCOMMON,
    target: 'player',
    effects: [
      {
        type: 'xp_boost',
        value: 0.05,
        description: '+5% XP auf abgeschlossene Quests.',
      },
    ],
    lore:
      'Die Schreibfeder der Erzmagierin Solvig. Wer sie bei sich trägt, lernt ' +
      'aus jedem Abenteuer ein wenig mehr — die Feder flüstert nachts die ' +
      'Lektionen des Tages.',
  },
  {
    id: 'ember_scale',
    name: 'Glutschuppe',
    emoji: '🔥',
    rarity: Rarity.UNCOMMON,
    target: 'dragon',
    effects: [
      {
        type: 'dragon_xp',
        value: 0.06,
        description: 'Dein Drache erhält +6% XP.',
      },
    ],
    lore:
      'Eine abgeworfene Schuppe des Urdrachen Vulkanor. Sie ist noch warm. ' +
      'Junge Drachen, die in ihrer Nähe schlafen, träumen von Flügen über ' +
      'brennende Berge und wachsen schneller.',
  },
  {
    id: 'silver_flask',
    name: 'Silberflakon',
    emoji: '⚗️',
    rarity: Rarity.UNCOMMON,
    target: 'player',
    effects: [
      {
        type: 'luck',
        value: 0.08,
        description: 'Glück: 8% Chance, einen Schatz doppelt zu finden.',
      },
    ],
    lore:
      'Enthält einen Rest „Flüssiges Glück“ aus dem Labor des Alchemisten ' +
      'Quirin. Der Korken klemmt seit hundert Jahren — aber schon der Duft, ' +
      'der durchsickert, verbiegt die Wahrscheinlichkeit.',
  },
  {
    id: 'bard_lute',
    name: 'Barden-Laute',
    emoji: '🪕',
    rarity: Rarity.UNCOMMON,
    target: 'cosmetic',
    effects: [
      {
        type: 'cosmetic',
        value: 0,
        description:
          'Rein kosmetisch — deine Abenteuer klingen jetzt heroischer.',
      },
    ],
    lore:
      'Die Laute des fahrenden Barden Larion Silberzunge. Eine Saite fehlt, ' +
      'aber die verbliebenen erzählen bei jedem Griff von Heldentaten, die noch ' +
      'niemand vollbracht hat. Vielleicht deine?',
  },

  // ── Rare ─────────────────────────────────────────────────────────────────
  {
    id: 'amulet_of_swiftness',
    name: 'Amulett der Schnelligkeit',
    emoji: '📿',
    rarity: Rarity.RARE,
    target: 'player',
    effects: [
      {
        type: 'xp_boost',
        value: 0.1,
        description: '+10% XP auf abgeschlossene Quests.',
      },
    ],
    lore:
      'Getragen von der Botenläuferin Aiyana, die die Nachricht vom Fall ' +
      'Drachensteins in einer einzigen Nacht über drei Gebirge trug. Das Amulett ' +
      'schlägt im Rhythmus eines Herzens, das niemals müde wird.',
  },
  {
    id: 'dragon_saddle',
    name: 'Drachensattel',
    emoji: '🐉',
    rarity: Rarity.RARE,
    target: 'dragon',
    effects: [
      {
        type: 'dragon_xp',
        value: 0.12,
        description: 'Dein Drache erhält +12% XP.',
      },
    ],
    lore:
      'Gefertigt von den Sattlern von Wolkenfeste, deren Werkstatt auf dem ' +
      'Rücken eines fliegenden Wals thront. Ein Drache mit Sattel weiß: Er wird ' +
      'gebraucht. Und wer gebraucht wird, wächst über sich hinaus.',
  },
  {
    id: 'cartographer_lens',
    name: 'Kartographen-Linse',
    emoji: '🔍',
    rarity: Rarity.RARE,
    target: 'player',
    effects: [
      {
        type: 'treasure_sense',
        value: 200,
        description: 'Schatz-Sinn: +200 m Einsammel-Reichweite.',
      },
    ],
    lore:
      'Elriks Meisterstück — geschliffen, nachdem er endlich eine Brille trug. ' +
      'Durch die Linse betrachtet zeigt jede Landschaft ihre Geheimnisse: alte ' +
      'Pfade, vergessene Verstecke, vergrabenes Gold.',
  },
  {
    id: 'phoenix_plume',
    name: 'Phönixfeder',
    emoji: '🪽',
    rarity: Rarity.RARE,
    target: 'cosmetic',
    effects: [
      {
        type: 'cosmetic',
        value: 0,
        description: 'Rein kosmetisch — umgibt dich mit einem warmen Glühen.',
      },
    ],
    lore:
      'Beim dritten Wiederaufstieg des Phönix von Morgenfels fiel genau eine ' +
      'Feder zu Boden. Sie ist federleicht, glüht von innen und wird niemals ' +
      'kalt. Sammler bieten Königreiche dafür.',
  },

  // ── Epic ─────────────────────────────────────────────────────────────────
  {
    id: 'crown_of_embers',
    name: 'Glutkrone',
    emoji: '👑',
    rarity: Rarity.EPIC,
    target: 'dragon',
    craftOnly: true,
    effects: [
      {
        type: 'dragon_xp',
        value: 0.2,
        description: 'Dein Drache erhält +20% XP.',
      },
    ],
    lore:
      'Geschmiedet aus Glutschuppen und einer Phönixfeder — die Krönungsinsignie ' +
      'der alten Drachenkönige. Ein Drache, der sie trägt, erinnert sich an die ' +
      'Größe seiner Ahnen und strebt ihr entgegen.',
  },
  {
    id: 'boots_of_the_comet',
    name: 'Kometenstiefel',
    emoji: '💫',
    rarity: Rarity.EPIC,
    target: 'player',
    effects: [
      {
        type: 'xp_boost',
        value: 0.18,
        description: '+18% XP auf abgeschlossene Quests.',
      },
    ],
    lore:
      'Aus dem Leder eines gefallenen Sternenrochens genäht. Wer sie trägt, ' +
      'hinterlässt bei Nacht eine schwach leuchtende Spur — und kommt an, bevor ' +
      'der Zweifel ihn einholt.',
  },

  // ── Legendary ────────────────────────────────────────────────────────────
  {
    id: 'heart_of_the_hoard',
    name: 'Herz des Hortes',
    emoji: '❤️‍🔥',
    rarity: Rarity.LEGENDARY,
    target: 'dragon',
    effects: [
      {
        type: 'xp_boost',
        value: 0.15,
        description: '+15% XP auf abgeschlossene Quests.',
      },
      {
        type: 'dragon_xp',
        value: 0.15,
        description: 'Dein Drache erhält +15% XP.',
      },
      {
        type: 'luck',
        value: 0.05,
        description: 'Glück: 5% Chance auf Doppelfund.',
      },
    ],
    lore:
      'Der Kern des ältesten Drachenhorts der Welt: Über Jahrtausende ist all ' +
      'das gehütete Gold zu einem einzigen, glühenden Herz verschmolzen. Es ' +
      'schlägt für dich und deinen Drachen zugleich.',
  },
  {
    id: 'sidequest_sigil',
    name: 'Siegel von SideQuest',
    emoji: '🔱',
    rarity: Rarity.LEGENDARY,
    target: 'cosmetic',
    craftOnly: true,
    effects: [
      {
        type: 'cosmetic',
        value: 0,
        description: 'Das Zeichen wahrer Abenteurer — pure Prahlerei.',
      },
      {
        type: 'luck',
        value: 0.1,
        description: 'Glück: 10% Chance, einen Schatz doppelt zu finden.',
      },
    ],
    lore:
      'Das Gildenzeichen der allerersten Abenteurer, die begriffen: Der Umweg ' +
      'ist das Ziel. Wer das Siegel trägt, hat bewiesen, dass keine Nebenquest ' +
      'zu klein und kein Schatz zu weit ist.',
  },
];

export function getTreasureItem(id: string): TreasureItemDef | undefined {
  return TREASURE_CATALOG.find((item) => item.id === id);
}
