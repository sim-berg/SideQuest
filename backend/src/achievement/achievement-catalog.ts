import { SIDEQUEST_TEMPLATES } from '../quest/sidequest-templates.js';
import { Category } from '../quest/enums/category.enum.js';
import { CHALLENGE_CATALOG } from '../track/catalog/challenges.catalog.js';
import { STORY_ARC_CATALOG } from '../track/catalog/story-arcs.catalog.js';

/**
 * An achievement definition. Achievements are the collectible reward for
 * finishing side quests — each side quest template maps to exactly one
 * achievement (the relation), plus a few cross-cutting milestone achievements.
 *
 * `prompt` drives the Replicate transparent-PNG badge generation; `emoji` +
 * `color` drive the deterministic SVG fallback when no token is configured.
 */
export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  prompt: string;
  emoji: string;
  color: string;
  /** The side quest template that grants this achievement (relation). */
  sideQuestTemplateId: string | null;
}

const CATEGORY_STYLE: Record<Category, { emoji: string; color: string }> = {
  [Category.SPORT]: { emoji: '🏅', color: '#22c55e' },
  [Category.SOCIAL]: { emoji: '🤝', color: '#3b82f6' },
  [Category.ADVENTURE]: { emoji: '🧭', color: '#f59e0b' },
  [Category.SKILL]: { emoji: '🧠', color: '#a855f7' },
  [Category.MYSTERY]: { emoji: '🔮', color: '#ef4444' },
};

const PROMPT_BASE =
  'A glossy circular video-game achievement badge sticker, bold rim light, ' +
  'centered emblem, vibrant colors, clean vector style, game UI icon, ' +
  'transparent background, no text';

/** Achievement per side quest template — the SideQuest ↔ Achievement relation. */
const TEMPLATE_ACHIEVEMENTS: AchievementDef[] = SIDEQUEST_TEMPLATES.map((t) => {
  const style = CATEGORY_STYLE[t.category];
  return {
    key: `ach_${t.id}`,
    title: `${t.title} – Errungenschaft`,
    description: `Schließe die SideQuest „${t.title}" ab.`,
    prompt: `${PROMPT_BASE}, theme: ${t.title} (${t.category})`,
    emoji: style.emoji,
    color: style.color,
    sideQuestTemplateId: t.id,
  };
});

/**
 * The one emblem everybody starts with — granted at registration so a brand
 * new profile is never an empty shelf.
 */
export const STARTER_ACHIEVEMENT_KEY = 'ach_neustarter';

/** Milestone achievements not tied to a single template. */
const MILESTONE_ACHIEVEMENTS: AchievementDef[] = [
  {
    key: STARTER_ACHIEVEMENT_KEY,
    title: 'Neustarter',
    description: 'Willkommen bei SideQuest — deine Reise beginnt hier.',
    prompt: `${PROMPT_BASE}, theme: a sunrise over an open road with a compass rose, fresh start, welcome emblem`,
    emoji: '🌅',
    color: '#38bdf8',
    sideQuestTemplateId: null,
  },
  {
    key: 'ach_first_sidequest',
    title: 'Erster Schritt',
    description: 'Schließe deine allererste SideQuest ab.',
    prompt: `${PROMPT_BASE}, theme: a single golden footprint star, beginner trophy`,
    emoji: '⭐',
    color: '#eab308',
    sideQuestTemplateId: null,
  },
  {
    key: 'ach_daily_streak',
    title: 'Tagewerk',
    description: 'Schließe an einem Tag eine tägliche SideQuest ab.',
    prompt: `${PROMPT_BASE}, theme: a glowing calendar with a checkmark, daily streak`,
    emoji: '📅',
    color: '#06b6d4',
    sideQuestTemplateId: null,
  },
  {
    key: 'ach_board_cleared',
    title: 'Reine Tafel',
    description: 'Schließe an einem Tag alle drei Tagesquests ab.',
    prompt: `${PROMPT_BASE}, theme: three golden checkmarks in a row on a slate board`,
    emoji: '✅',
    color: '#22c55e',
    sideQuestTemplateId: null,
  },
  {
    key: 'ach_streak_3',
    title: 'Dreitagefeuer',
    description: 'Sichere dir drei Tage in Folge.',
    prompt: `${PROMPT_BASE}, theme: a small campfire with the number three, warm embers`,
    emoji: '🔥',
    color: '#f97316',
    sideQuestTemplateId: null,
  },
  {
    key: 'ach_streak_7',
    title: 'Wochenheld',
    description: 'Sichere dir sieben Tage in Folge.',
    prompt: `${PROMPT_BASE}, theme: a blazing seven-day flame crest, laurel wreath`,
    emoji: '🏆',
    color: '#eab308',
    sideQuestTemplateId: null,
  },
  {
    key: 'ach_streak_30',
    title: 'Monatslegende',
    description: 'Sichere dir dreißig Tage in Folge.',
    prompt: `${PROMPT_BASE}, theme: a legendary golden calendar crown wreathed in fire`,
    emoji: '👑',
    color: '#a855f7',
    sideQuestTemplateId: null,
  },
];

/** Streak length → milestone achievement unlocked at exactly that length. */
export const STREAK_MILESTONES: { days: number; key: string }[] = [
  { days: 3, key: 'ach_streak_3' },
  { days: 7, key: 'ach_streak_7' },
  { days: 30, key: 'ach_streak_30' },
];

/**
 * Emblem per track — the reward for finishing a challenge or story arc.
 *
 * Derived from the track catalog rather than hand-listed, so a new challenge
 * brings its emblem with it and the two can never drift apart.
 */
const TRACK_ACHIEVEMENTS: AchievementDef[] = [
  ...CHALLENGE_CATALOG,
  ...STORY_ARC_CATALOG,
].map((t) => ({
  key: t.emblemKey,
  title: t.title,
  description: `Schließe „${t.title}" vollständig ab.`,
  prompt: `${PROMPT_BASE}, theme: ${t.title} — ${t.tagline}, ornate medal`,
  emoji: t.emoji,
  color: t.color,
  sideQuestTemplateId: null,
}));

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  ...TEMPLATE_ACHIEVEMENTS,
  ...MILESTONE_ACHIEVEMENTS,
  ...TRACK_ACHIEVEMENTS,
];

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENT_CATALOG.find((a) => a.key === key);
}

export function getAchievementForTemplate(
  templateId: string,
): AchievementDef | undefined {
  return ACHIEVEMENT_CATALOG.find((a) => a.sideQuestTemplateId === templateId);
}
