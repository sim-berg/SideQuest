import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quest, QuestDocument } from './schemas/quest.schema.js';
import {
  QuestRedemption,
  QuestRedemptionDocument,
} from './schemas/quest-redemption.schema.js';
import { QuestType } from './enums/quest-type.enum.js';
import { Category } from './enums/category.enum.js';
import { Difficulty } from './enums/difficulty.enum.js';
import { CoinService } from '../coin/coin.service.js';
import { PetService } from '../pet/pet.service.js';
import { SoulService } from '../pet/soul.service.js';
import { UserService } from '../user/user.service.js';

/** Pet XP for a redeemed world quest. */
const WORLD_QUEST_XP = 100;
const DEFAULT_WORLD_REWARD = 50;

/**
 * World quests: bigger events organized by outside firms. Users prove they
 * were on site by scanning the organizer's QR code; each user can redeem a
 * quest once. Until a firm portal exists, demo quests are seeded on boot.
 */
@Injectable()
export class WorldQuestService implements OnModuleInit {
  private readonly logger = new Logger(WorldQuestService.name);

  constructor(
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    @InjectModel(QuestRedemption.name)
    private redemptionModel: Model<QuestRedemptionDocument>,
    private readonly coinService: CoinService,
    private readonly petService: PetService,
    private readonly soulService: SoulService,
    private readonly userService: UserService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedDemoQuests();
    } catch (err) {
      this.logger.error('World quest seeding failed', err as Error);
    }
  }

  /** Redeem a world quest by QR code — once per user. */
  async redeem(questId: string, userId: string, code: string) {
    const quest = await this.questModel.findById(questId).exec();
    if (!quest) throw new NotFoundException(`Quest ${questId} not found`);
    if (quest.type !== QuestType.WORLD) {
      throw new BadRequestException('Das ist kein Welt-Quest');
    }
    if (!quest.qrToken || quest.qrToken !== code.trim()) {
      throw new BadRequestException('Ungültiger QR-Code');
    }

    const coins = quest.reward ?? DEFAULT_WORLD_REWARD;
    try {
      await this.redemptionModel.create({ questId, userId, coins });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Du hast dieses Quest bereits eingelöst');
      }
      throw err;
    }

    await this.coinService.mint(userId, coins, 'world_reward', {
      refType: 'quest',
      refId: questId,
    });
    const xpResult = await this.petService.recordQuestCompletion(
      userId,
      WORLD_QUEST_XP,
      { category: quest.category },
    );
    await this.userService.incrementQuestsCompleted(userId);
    void this.soulService.refreshUserSoul(userId);

    return { coins, xpResult };
  }

  /** Whether the user already redeemed this world quest. */
  async getRedemptionState(questId: string, userId: string) {
    const redemption = await this.redemptionModel
      .findOne({ questId, userId })
      .exec();
    return {
      redeemed: !!redemption,
      redeemedAt: redemption?.createdAt?.toISOString() ?? null,
      coins: redemption?.coins ?? null,
    };
  }

  /**
   * QR payload for the organizer's display. Only the quest's creator may
   * fetch it — for the seeded demo quests the token is logged on boot.
   */
  async getQrPayload(questId: string, userId: string) {
    const quest = await this.questModel.findById(questId).exec();
    if (!quest) throw new NotFoundException(`Quest ${questId} not found`);
    if (quest.type !== QuestType.WORLD || quest.createdBy !== userId) {
      throw new BadRequestException('Kein Zugriff auf diesen QR-Code');
    }
    return { code: quest.qrToken };
  }

  /** Seed a few Berlin demo world quests until there is a firm portal. */
  private async seedDemoQuests(): Promise<void> {
    const existing = await this.questModel
      .countDocuments({ type: QuestType.WORLD })
      .exec();
    if (existing > 0) return;

    const demos = [
      {
        title: 'Kiez-Putztag im Volkspark',
        description:
          'Die Stadtwerke laden zum großen Frühjahrsputz im Volkspark ' +
          'Friedrichshain. Handschuhe und Säcke gibt es vor Ort — am Ende ' +
          'wartet der QR-Code am Infostand.',
        lat: 52.5262,
        lng: 13.4318,
        address: 'Volkspark Friedrichshain, Berlin',
        category: Category.SOCIAL,
        questGiver: { name: 'Berliner Stadtwerke' },
        reward: 80,
        qrToken: 'SIDEQUEST-PUTZTAG-2026',
      },
      {
        title: 'Tempelhofer Feld Lauf-Challenge',
        description:
          'Eine Runde übers Feld mit dem lokalen Sportverein. Nach dem ' +
          'Zieleinlauf den QR-Code an der Verpflegungsstation scannen.',
        lat: 52.4736,
        lng: 13.4018,
        address: 'Tempelhofer Feld, Berlin',
        category: Category.SPORT,
        questGiver: { name: 'SC Tempelhof' },
        reward: 60,
        qrToken: 'SIDEQUEST-FELDLAUF-2026',
      },
    ];

    for (const demo of demos) {
      await this.questModel.create({
        ...demo,
        type: QuestType.WORLD,
        difficulty: Difficulty.MEDIUM,
      });
      this.logger.log(
        `Seeded world quest "${demo.title}" — QR code: ${demo.qrToken}`,
      );
    }
  }
}
