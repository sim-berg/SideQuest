import { Injectable, Logger } from '@nestjs/common';
import { AnthropicService } from './anthropic.service.js';
import { SoulService } from './soul.service.js';
import { PetService } from './pet.service.js';
import { ELEMENTS, getSpeciesDef } from './pet-catalog.js';
import { Element } from './enums/element.enum.js';
import { Category } from '../quest/enums/category.enum.js';
import { Difficulty } from '../quest/enums/difficulty.enum.js';

export interface GeneratedDaily {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  emoji: string;
}

const DAILY_SCHEMA = {
  type: 'object',
  properties: {
    quests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['sport', 'social', 'adventure', 'skill', 'mystery'],
          },
          difficulty: { type: 'string', enum: ['easy', 'medium'] },
          emoji: { type: 'string' },
        },
        required: ['title', 'description', 'category', 'difficulty', 'emoji'],
        additionalProperties: false,
      },
    },
  },
  required: ['quests'],
  additionalProperties: false,
} as const;

/**
 * The pet as quest-giver: writes the user's personalized daily quest row from
 * both soul.md documents. Returns null whenever anything is off — the caller
 * falls back to the static template pool.
 */
@Injectable()
export class PetQuestmasterService {
  private readonly logger = new Logger(PetQuestmasterService.name);

  constructor(
    private readonly anthropic: AnthropicService,
    private readonly soulService: SoulService,
    private readonly petService: PetService,
  ) {}

  async generateDailyQuests(
    userId: string,
    recentTitles: string[],
  ): Promise<GeneratedDaily[] | null> {
    if (!this.anthropic.hasKey) return null;
    try {
      const pet = await this.petService.getActive(userId);
      // Only a hatched companion writes quests; egg owners get templates.
      if (!pet || !pet.species || !pet.element) return null;

      const species = getSpeciesDef(pet.species);
      const element = ELEMENTS[pet.element as Element];
      const userSoul = await this.soulService.getUserSoulContent(userId);
      const stats = await this.soulService.collectUserStats(userId);

      const result = await this.anthropic.generateJson<{
        quests: GeneratedDaily[];
      }>({
        system:
          `Du bist ${pet.name || `das ${element.name}-${species?.name}`}, der Quest-Gefährte deines Menschen in der deutschen Abenteuer-App SideQuest. ` +
          'Du stellst ihm jeden Morgen genau 3 Daily-Quests zusammen.\n\n' +
          (pet.soul ? `Deine Seele:\n${pet.soul}\n\n` : '') +
          (userSoul ? `Was du über deinen Menschen weißt:\n${userSoul}\n\n` : '') +
          'Regeln für gute Daily-Quests:\n' +
          '- Klein und an einem gewöhnlichen Tag in wenigen Minuten machbar.\n' +
          '- Selbst abhakbar: kein GPS, kein bestimmter Ort, nichts Gefährliches, keine Ausgaben.\n' +
          '- Konkret formuliert (messbar: Anzahl, Minuten, "einmal heute").\n' +
          '- Titel maximal 40 Zeichen, Beschreibung maximal 160 Zeichen, deutsch, du-Form.\n' +
          '- Abwechslungsreich über die Kategorien, zugeschnitten auf die Spielweise deines Menschen.\n' +
          '- Genau 3 Quests: zwei mit difficulty "easy", eine mit "medium".\n' +
          '- Gern mit einer persönlichen Note deines Elements/Wesens im Ton.',
        prompt:
          `Erstelle die 3 Daily-Quests für heute.\n` +
          `Streak: ${stats.dailyStreak} Tage.\n` +
          `Nicht wiederholen (zuletzt gestellt): ${recentTitles.join('; ') || '—'}`,
        schema: DAILY_SCHEMA as unknown as Record<string, unknown>,
      });

      const quests = result?.quests;
      if (!quests || !Array.isArray(quests) || quests.length !== 3) return null;
      if (!quests.every((q) => this.isValid(q))) return null;
      // Keep the board shape guaranteed: easy, easy, medium.
      const easy = quests.filter((q) => q.difficulty === Difficulty.EASY);
      const medium = quests.filter((q) => q.difficulty === Difficulty.MEDIUM);
      if (easy.length !== 2 || medium.length !== 1) return null;
      return [...easy, ...medium];
    } catch (err) {
      this.logger.error('generateDailyQuests failed', err as Error);
      return null;
    }
  }

  private isValid(q: GeneratedDaily): boolean {
    return (
      typeof q.title === 'string' &&
      q.title.trim().length > 0 &&
      q.title.length <= 60 &&
      typeof q.description === 'string' &&
      q.description.trim().length > 0 &&
      q.description.length <= 220 &&
      Object.values(Category).includes(q.category) &&
      (q.difficulty === Difficulty.EASY || q.difficulty === Difficulty.MEDIUM) &&
      typeof q.emoji === 'string' &&
      q.emoji.length <= 8
    );
  }
}
