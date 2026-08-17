import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnthropicService } from './anthropic.service.js';
import { Pet, PetDocument } from './schemas/pet.schema.js';
import { UserSoul, UserSoulDocument } from './schemas/user-soul.schema.js';
import {
  DailySideQuest,
  DailySideQuestDocument,
} from '../quest/schemas/daily-sidequest.schema.js';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import { UserService } from '../user/user.service.js';
import { ELEMENTS, getSpeciesDef } from './pet-catalog.js';
import { Element } from './enums/element.enum.js';

const CATEGORY_LABELS: Record<string, string> = {
  sport: 'Sport & Bewegung',
  social: 'Soziales',
  adventure: 'Abenteuer',
  skill: 'Können & Lernen',
  mystery: 'Mysterien',
};

export interface UserStats {
  username: string;
  displayName: string;
  bio: string;
  questsCompleted: number;
  dailyStreak: number;
  longestDailyStreak: number;
  categoryCounts: Record<string, number>;
  recentDailyTitles: string[];
}

/**
 * Builds and maintains the two "soul.md" documents: the pet's personality
 * (written once at hatch) and the user's play-style profile (refreshed at
 * most daily). Both feed the pet's chat persona and quest generation.
 */
@Injectable()
export class SoulService {
  private readonly logger = new Logger(SoulService.name);

  constructor(
    private readonly anthropic: AnthropicService,
    private readonly userService: UserService,
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectModel(UserSoul.name) private soulModel: Model<UserSoulDocument>,
    @InjectModel(DailySideQuest.name)
    private dailyModel: Model<DailySideQuestDocument>,
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
  ) {}

  async collectUserStats(userId: string): Promise<UserStats> {
    const [user, dailies, quests] = await Promise.all([
      this.userService.findById(userId),
      this.dailyModel
        .find({ userId, completed: true })
        .sort({ completedAt: -1 })
        .select('category title')
        .exec(),
      this.questModel.find({ completedBy: userId }).select('category').exec(),
    ]);

    const categoryCounts: Record<string, number> = {};
    for (const d of dailies) {
      categoryCounts[d.category] = (categoryCounts[d.category] ?? 0) + 1;
    }
    for (const q of quests) {
      categoryCounts[q.category] = (categoryCounts[q.category] ?? 0) + 1;
    }

    return {
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.bio || '',
      questsCompleted: user.questsCompleted ?? 0,
      dailyStreak: user.dailyQuestStreak ?? 0,
      longestDailyStreak: user.longestDailyQuestStreak ?? 0,
      categoryCounts,
      recentDailyTitles: dailies.slice(0, 12).map((d) => d.title),
    };
  }

  getUserSoulContent(userId: string): Promise<string> {
    return this.soulModel
      .findOne({ userId })
      .exec()
      .then((doc) => doc?.content ?? '');
  }

  /**
   * Rebuild the user's soul.md — throttled to once per day. Fire-and-forget
   * from the board-cleared path; never throws.
   */
  async refreshUserSoul(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await this.soulModel.findOne({ userId }).exec();
      if (existing?.lastBuiltDate === today) return;

      const stats = await this.collectUserStats(userId);
      const content =
        (await this.generateUserSoulLlm(stats)) ??
        this.buildFallbackUserSoul(stats);

      await this.soulModel
        .findOneAndUpdate(
          { userId },
          { $set: { content, lastBuiltDate: today } },
          { upsert: true },
        )
        .exec();
    } catch (err) {
      this.logger.error('refreshUserSoul failed', err as Error);
    }
  }

  private async generateUserSoulLlm(stats: UserStats): Promise<string | null> {
    const categories = Object.entries(stats.categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${CATEGORY_LABELS[c] ?? c}: ${n}`)
      .join(', ');

    return this.anthropic.generateText({
      system:
        'Du schreibst kompakte Spielerprofile ("soul.md") für eine deutsche ' +
        'Abenteuer-App, in der echte Menschen Quests im Alltag und draußen ' +
        'erledigen. Schreibe warmherzig, konkret und auf Deutsch. Markdown, ' +
        'maximal ~200 Wörter. Abschnitte: "## Wer", "## Wie er/sie spielt", ' +
        '"## Was ihm/ihr guttun würde". Keine erfundenen Fakten.',
      messages: [
        {
          role: 'user',
          content:
            `Erstelle das Spielerprofil.\n` +
            `Name: ${stats.displayName} (@${stats.username})\n` +
            (stats.bio ? `Bio: ${stats.bio}\n` : '') +
            `Abgeschlossene Quests: ${stats.questsCompleted}\n` +
            `Daily-Streak: ${stats.dailyStreak} (Rekord: ${stats.longestDailyStreak})\n` +
            `Quests nach Kategorie: ${categories || 'noch keine'}\n` +
            `Zuletzt erledigte Dailys: ${stats.recentDailyTitles.join('; ') || 'noch keine'}`,
        },
      ],
    });
  }

  private buildFallbackUserSoul(stats: UserStats): string {
    const top = Object.entries(stats.categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    return [
      `# Seele von ${stats.displayName}`,
      '',
      `- Abgeschlossene Quests: ${stats.questsCompleted}`,
      `- Daily-Streak: ${stats.dailyStreak} (Rekord: ${stats.longestDailyStreak})`,
      top
        ? `- Lieblingskategorie: ${CATEGORY_LABELS[top[0]] ?? top[0]}`
        : '- Noch auf den ersten Abenteuern unterwegs.',
    ].join('\n');
  }

  /**
   * Upgrade a freshly hatched pet's fallback soul with an LLM-written
   * personality. Fire-and-forget after hatch; keeps the fallback on failure.
   */
  async upgradePetSoul(petId: string): Promise<void> {
    try {
      const pet = await this.petModel.findById(petId).exec();
      if (!pet || !pet.species || !pet.element) return;

      const species = getSpeciesDef(pet.species);
      const element = ELEMENTS[pet.element];
      if (!species || !element) return;

      const stats = await this.collectUserStats(pet.userId);
      const soul = await this.anthropic.generateText({
        system:
          'Du erschaffst die Seele ("soul.md") eines frisch geschlüpften ' +
          'Elementarwesens in einer deutschen Abenteuer-App. Schreibe auf ' +
          'Deutsch, Markdown, ~150-250 Wörter. Abschnitte: "# Seele von ..." ' +
          '(mit einem selbstgewählten mystischen Eigennamen), "## Wesen" ' +
          '(Persönlichkeit, geprägt von Element und Tierart), "## Bindung" ' +
          '(Bezug zu seinem Menschen und dessen Spielweise), "## Eigenheiten" ' +
          '(2-3 liebenswerte Macken). Die Seele dient später als Chat-Persona ' +
          'des Wesens — mache sie charakterstark und konsistent.',
        messages: [
          {
            role: 'user',
            content:
              `Element: ${element.name} ${element.emoji}\n` +
              `Tierart: ${species.name} ${species.emoji}\n` +
              `Sein Mensch: ${stats.displayName}, ` +
              `${stats.questsCompleted} Quests abgeschlossen, ` +
              `Streak ${stats.dailyStreak}.\n` +
              (stats.bio ? `Bio des Menschen: ${stats.bio}\n` : '') +
              `Meistgespielte Kategorien: ${
                Object.entries(stats.categoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([c]) => CATEGORY_LABELS[c] ?? c)
                  .join(', ') || 'noch unbekannt'
              }`,
          },
        ],
      });
      if (soul) {
        pet.soul = soul;
        await pet.save();
      }
    } catch (err) {
      this.logger.error('upgradePetSoul failed', err as Error);
    }
  }
}
