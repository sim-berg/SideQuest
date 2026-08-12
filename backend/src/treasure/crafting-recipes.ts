/**
 * Crafting: 2–3 Inventar-Items werden zu einem selteneren Item kombiniert.
 * Matching ist reihenfolgen-unabhängig (Multiset-Vergleich der itemIds).
 * Rezepte mit `unlockTemplateId` schaltet man frei, indem man die zugehörige
 * SideQuest (Map-Spawn oder Daily) abschließt.
 */
export interface RecipeIngredient {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  resultItemId: string;
  /** SideQuest template that must be completed to unlock this recipe. */
  unlockTemplateId?: string;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'recipe_redgem_goggles',
    name: 'Rotglas-Gucker',
    description:
      'Zwei schlichte Brillen, ein Roter Splitter — der Klassiker der ' +
      'Schatzsucher-Zunft.',
    ingredients: [
      { itemId: 'simple_glasses', count: 2 },
      { itemId: 'red_gem', count: 1 },
    ],
    resultItemId: 'redgem_goggles',
  },
  {
    id: 'recipe_amulet_of_swiftness',
    name: 'Amulett der Schnelligkeit',
    description:
      'Zwei Paar eingelaufene Stiefel und eine Eulenfeder ergeben ein Amulett, ' +
      'das niemals müde wird.',
    ingredients: [
      { itemId: 'worn_boots', count: 2 },
      { itemId: 'owl_feather', count: 1 },
    ],
    resultItemId: 'amulet_of_swiftness',
    unlockTemplateId: 'sq_sprint',
  },
  {
    id: 'recipe_dragon_saddle',
    name: 'Drachensattel',
    description:
      'Ein Reisemantel als Sitzpolster, zwei Glutschuppen als Beschlag — fertig ' +
      'ist der Sattel für wahre Gefährten.',
    ingredients: [
      { itemId: 'traveler_cloak', count: 1 },
      { itemId: 'ember_scale', count: 2 },
    ],
    resultItemId: 'dragon_saddle',
    unlockTemplateId: 'sq_explore_unknown',
  },
  {
    id: 'recipe_crown_of_embers',
    name: 'Glutkrone',
    description:
      'Zwei Glutschuppen, gebettet auf eine Phönixfeder — die Krönungsinsignie ' +
      'der alten Drachenkönige.',
    ingredients: [
      { itemId: 'ember_scale', count: 2 },
      { itemId: 'phoenix_plume', count: 1 },
    ],
    resultItemId: 'crown_of_embers',
    unlockTemplateId: 'sq_riddle',
  },
  {
    id: 'recipe_sidequest_sigil',
    name: 'Siegel von SideQuest',
    description:
      'Phönixfeder, Kartographen-Linse und das Amulett der Schnelligkeit — ' +
      'vereint zum Zeichen wahrer Abenteurer.',
    ingredients: [
      { itemId: 'phoenix_plume', count: 1 },
      { itemId: 'cartographer_lens', count: 1 },
      { itemId: 'amulet_of_swiftness', count: 1 },
    ],
    resultItemId: 'sidequest_sigil',
    unlockTemplateId: 'sq_kindness',
  },
];

export function getRecipe(id: string): CraftingRecipe | undefined {
  return CRAFTING_RECIPES.find((r) => r.id === id);
}
