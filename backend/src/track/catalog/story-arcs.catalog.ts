import { Category } from '../../quest/enums/category.enum.js';
import { Difficulty } from '../../quest/enums/difficulty.enum.js';
import {
  BonusTrigger,
  Metric,
  ObjectiveKind,
  TrackKind,
} from '../enums/track.enums.js';
import type {
  ArcChapter,
  BonusRule,
  Objective,
} from '../schemas/track.schema.js';

/**
 * Story arcs — the narrated sibling of the challenge.
 *
 * Same base, one difference that changes everything: objectives carry
 * `unlocksAtStep`, so they arrive chapter by chapter instead of all at once.
 * Where a challenge says "here are six things, chase them in any order", an arc
 * says "do this, and then you'll learn what comes next".
 */
export interface StoryArcDef {
  kind: typeof TrackKind.STORY_ARC;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  emoji: string;
  color: string;
  category: Category;
  difficulty: Difficulty;
  objectives: Objective[];
  chapters: ArcChapter[];
  conclusion: string;
  hideFutureChapters: boolean;
  bonusRules: BonusRule[];
  completionXp: number;
  completionCoins: number;
  emblemKey: string;
  durationDays: number | null;
  featuredRank: number;
  tags: string[];
}

function arcObj(o: {
  id: string;
  title: string;
  description: string;
  emoji: string;
  kind: ObjectiveKind;
  metric: Metric;
  target: number;
  xp: number;
  step: number;
  optional?: boolean;
}): Objective {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    emoji: o.emoji,
    kind: o.kind,
    metric: o.metric,
    target: o.target,
    xpReward: o.xp,
    resetOn: null,
    optional: o.optional ?? false,
    unlocksAtStep: o.step,
  };
}

export const STORY_ARC_CATALOG: StoryArcDef[] = [
  {
    kind: TrackKind.STORY_ARC,
    slug: 'sa_first_steps',
    title: 'Der erste Aufbruch',
    tagline: 'Wie aus einem Spaziergang eine Gewohnheit wird.',
    description:
      'Ein Einstiegsbogen in vier Kapiteln. Er beginnt vor deiner Haustür und endet an einem ' +
      'Ort, den du ohne ihn nie gesehen hättest.',
    emoji: '🚪',
    color: '#f59e0b',
    category: Category.ADVENTURE,
    difficulty: Difficulty.EASY,
    chapters: [
      {
        step: 0,
        title: 'Die Schwelle',
        intro:
          'Jede Reise fängt mit dem Teil an, den niemand filmt: rausgehen. ' +
          'Mehr will dieses Kapitel nicht von dir.',
        outro: 'Du bist draußen. Der Rest ist Verhandlungssache.',
      },
      {
        step: 1,
        title: 'Die Runde',
        intro:
          'Jetzt weiter. Nicht schneller, nur länger — fünf Kilometer, verteilt wie du willst.',
        outro: 'Fünf Kilometer. Deine Beine wissen jetzt, wie das geht.',
      },
      {
        step: 2,
        title: 'Der Umweg',
        intro:
          'Zeit, vom bekannten Weg abzukommen. Drei Orte, an denen du noch nie warst.',
        outro: 'Drei neue Orte. Deine Stadt ist größer geworden.',
      },
      {
        step: 3,
        title: 'Die Gewohnheit',
        intro:
          'Das letzte Kapitel ist das unspektakulärste und das schwerste: ' +
          'sieben Tage hintereinander raus.',
        outro: 'Sieben Tage. Das ist keine Aktion mehr, das ist ein Rhythmus.',
      },
    ],
    conclusion:
      'Du hast angefangen, weitergemacht, dich verlaufen und bist drangeblieben. ' +
      'Genau in dieser Reihenfolge funktioniert es immer.',
    hideFutureChapters: true,
    objectives: [
      arcObj({
        id: 'o_arc1_out',
        title: 'Raus vor die Tür',
        description: 'Eine erste Route laufen, egal wie kurz.',
        emoji: '🚶',
        kind: ObjectiveKind.SINGLE,
        metric: Metric.ROUTE_COMPLETED,
        target: 1,
        xp: 150,
        step: 0,
      }),
      arcObj({
        id: 'o_arc1_5km',
        title: 'Fünf Kilometer',
        description: 'Insgesamt fünf Kilometer zurücklegen.',
        emoji: '📏',
        kind: ObjectiveKind.THRESHOLD,
        metric: Metric.ROUTE_DISTANCE_KM,
        target: 5,
        xp: 300,
        step: 1,
      }),
      arcObj({
        id: 'o_arc1_places',
        title: 'Drei neue Orte',
        description: 'An drei unbekannten Orten einchecken.',
        emoji: '📍',
        kind: ObjectiveKind.TALLY,
        metric: Metric.PLACE_CHECKIN,
        target: 3,
        xp: 400,
        step: 2,
      }),
      arcObj({
        id: 'o_arc1_streak',
        title: 'Sieben Tage draußen',
        description: 'Sieben Tage hintereinander eine Route laufen.',
        emoji: '🔥',
        kind: ObjectiveKind.STREAK,
        metric: Metric.ROUTE_COMPLETED,
        target: 7,
        xp: 700,
        step: 3,
      }),
    ],
    bonusRules: [
      {
        id: 'b_arc1_fast',
        label: 'Bogen schnell abgeschlossen',
        trigger: BonusTrigger.AHEAD_OF_SCHEDULE,
        value: 7,
        flatXp: 300,
        multiplier: 1,
      },
    ],
    completionXp: 1200,
    completionCoins: 200,
    emblemKey: 'ach_arc_first_steps',
    durationDays: 30,
    featuredRank: 94,
    tags: ['story', 'einstieg', 'draußen'],
  },
  {
    kind: TrackKind.STORY_ARC,
    slug: 'sa_own_feet',
    title: 'Auf eigenen Beinen',
    tagline: 'Fünf Kapitel bis zur ersten eigenen Bude.',
    description:
      'Der Erwachsenwerden-Bogen: kochen, waschen, sparen, bewerben, durchhalten. ' +
      'Keine Metapher — die Liste, die wirklich zählt.',
    emoji: '🔑',
    color: '#3b82f6',
    category: Category.SKILL,
    difficulty: Difficulty.HARD,
    chapters: [
      {
        step: 0,
        title: 'Sich selbst versorgen',
        intro: 'Erstes Kapitel, erste Wahrheit: wer kochen kann, ist freier.',
        outro: 'Zehn Mahlzeiten. Du verhungerst schon mal nicht.',
      },
      {
        step: 1,
        title: 'Ordnung halten',
        intro:
          'Eine eigene Wohnung ist zu 20 % Miete und zu 80 % Dinge, die niemand sonst wegräumt.',
        outro: 'Zwanzig Aufgaben erledigt. Es bleibt sauber, wenn du bleibst.',
      },
      {
        step: 2,
        title: 'Geld beiseitelegen',
        intro: 'Kaution, Umzug, erste Möbel. Dreihundert Euro sind der Anfang.',
        outro: 'Dreihundert Euro. Das ist Handlungsspielraum.',
      },
      {
        step: 3,
        title: 'Sich bewerben',
        intro: 'Eigene Bude heißt eigenes Einkommen. Fünf Bewerbungen raus.',
        outro: 'Fünf Bewerbungen. Jetzt heißt es warten und weitermachen.',
      },
      {
        step: 4,
        title: 'Durchhalten',
        intro:
          'Das letzte Kapitel misst nichts Neues. Nur, ob du zwei Wochen am Stück drangeblieben bist.',
        outro: 'Vierzehn Tage. Das ist der Unterschied zwischen Vorsatz und Charakter.',
      },
    ],
    conclusion:
      'Kochen, aufräumen, sparen, bewerben, dranbleiben. Der unspektakulärste Bogen im Spiel — ' +
      'und der einzige, der wirklich etwas an deinem Leben ändert.',
    hideFutureChapters: false,
    objectives: [
      arcObj({
        id: 'o_arc2_cook',
        title: 'Zehnmal gekocht',
        description: 'Zehn Mahlzeiten selbst zubereiten.',
        emoji: '🍳',
        kind: ObjectiveKind.TALLY,
        metric: Metric.MEAL_COOKED,
        target: 10,
        xp: 400,
        step: 0,
      }),
      arcObj({
        id: 'o_arc2_chores',
        title: 'Zwanzig Aufgaben',
        description: 'Zwanzigmal Haushalt erledigen.',
        emoji: '🧹',
        kind: ObjectiveKind.TALLY,
        metric: Metric.CHORE_DONE,
        target: 20,
        xp: 500,
        step: 1,
      }),
      arcObj({
        id: 'o_arc2_save',
        title: 'Dreihundert Euro',
        description: '300 € zurücklegen.',
        emoji: '💰',
        kind: ObjectiveKind.THRESHOLD,
        metric: Metric.MONEY_SAVED,
        target: 300,
        xp: 900,
        step: 2,
      }),
      arcObj({
        id: 'o_arc2_apply',
        title: 'Fünf Bewerbungen',
        description: 'Fünf Bewerbungen abschicken.',
        emoji: '✉️',
        kind: ObjectiveKind.TALLY,
        metric: Metric.JOB_APPLICATION,
        target: 5,
        xp: 700,
        step: 3,
      }),
      arcObj({
        id: 'o_arc2_persist',
        title: 'Vierzehn Tage dran',
        description: 'Zwei Wochen hintereinander das Tagesboard abräumen.',
        emoji: '🔥',
        kind: ObjectiveKind.STREAK,
        metric: Metric.DAILY_BOARD_CLEARED,
        target: 14,
        xp: 1000,
        step: 4,
      }),
    ],
    bonusRules: [
      {
        id: 'b_arc2_perfect',
        label: 'Bogen ohne Auslassung',
        trigger: BonusTrigger.PERFECT_RUN,
        value: 1,
        flatXp: 500,
        multiplier: 1,
      },
    ],
    completionXp: 3000,
    completionCoins: 500,
    emblemKey: 'ach_arc_own_feet',
    durationDays: null,
    featuredRank: 96,
    tags: ['story', 'zukunft', 'ernst'],
  },
];

export function getStoryArcDef(slug: string): StoryArcDef | undefined {
  return STORY_ARC_CATALOG.find((a) => a.slug === slug);
}
