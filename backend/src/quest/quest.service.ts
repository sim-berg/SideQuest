import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quest, QuestDocument } from './schemas/quest.schema.js';
import { Difficulty } from './enums/difficulty.enum.js';
import type { CreateQuestDto } from './dto/create-quest.dto.js';
import type { QuestFilterDto } from './dto/quest-filter.dto.js';
import { GeoService } from '../geo/geo.service.js';
import { DragonService } from '../dragon/dragon.service.js';
import { UserService } from '../user/user.service.js';
import { GoalType } from './enums/goal-type.enum.js';
import type { CompleteQuestDto } from './dto/complete-quest.dto.js';
import { DAILY_QUESTS_POOL } from './data/daily-quests.data.js';

function toPlain(doc: QuestDocument) {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    title: obj.title,
    description: obj.description,
    lat: obj.lat,
    lng: obj.lng,
    address: obj.address,
    category: obj.category,
    questGiver: obj.questGiver,
    reward: obj.reward,
    timeLimit: obj.timeLimit,
    difficulty: obj.difficulty ?? Difficulty.MEDIUM,
    goalType: obj.goalType ?? GoalType.PROXIMITY,
    goalCount: obj.goalCount ?? null,
    acceptedBy: obj.acceptedBy ?? null,
    acceptedAt: obj.acceptedAt?.toISOString?.() ?? null,
    completedBy: obj.completedBy ?? null,
    completedAt: obj.completedAt?.toISOString?.() ?? null,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

const XP_BY_DIFFICULTY: Record<string, number> = {
  [Difficulty.EASY]: 25,
  [Difficulty.MEDIUM]: 50,
  [Difficulty.HARD]: 100,
};

@Injectable()
export class QuestService {
  constructor(
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    private readonly geoService: GeoService,
    private readonly dragonService: DragonService,
    private readonly userService: UserService,
  ) {}

  async findAll(filter: QuestFilterDto) {
    const query: Record<string, unknown> = {};

    if (filter.categories?.length) {
      query.category = { $in: filter.categories };
    }
    if (filter.paidOnly) {
      query.reward = { $gt: 0 };
    }
    if (filter.timedOnly) {
      query.timeLimit = { $ne: null };
    }

    let docs = await this.questModel.find(query).sort({ createdAt: -1 }).exec();

    // Geo filter in-app (haversine) since we don't use a geo index
    if (filter.lat != null && filter.lng != null && filter.radius) {
      docs = docs.filter(
        (q) =>
          this.geoService.haversine(filter.lat!, filter.lng!, q.lat, q.lng) <=
          filter.radius!,
      );
    }

    return docs.map(toPlain);
  }

  async findOne(id: string) {
    const doc = await this.questModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Quest ${id} not found`);
    return toPlain(doc);
  }

  async create(dto: CreateQuestDto) {
    const doc = await this.questModel.create(dto);
    return toPlain(doc);
  }

  async acceptQuest(questId: string, userId: string) {
    const doc = await this.questModel.findById(questId).exec();
    if (!doc) throw new NotFoundException(`Quest ${questId} not found`);

    if (doc.completedBy) {
      throw new ConflictException('Quest already completed');
    }
    if (doc.acceptedBy) {
      throw new ConflictException('Quest already accepted');
    }

    doc.acceptedBy = userId;
    doc.acceptedAt = new Date();
    await doc.save();
    return toPlain(doc);
  }

  async completeQuest(
    questId: string,
    userId: string,
    dto: CompleteQuestDto,
  ) {
    const doc = await this.questModel.findById(questId).exec();
    if (!doc) throw new NotFoundException(`Quest ${questId} not found`);

    if (doc.acceptedBy !== userId) {
      throw new BadRequestException('Quest not accepted by this user');
    }
    if (doc.completedBy) {
      throw new ConflictException('Quest already completed');
    }

    const goalType = doc.goalType ?? GoalType.PROXIMITY;

    // GPS proximity check only for proximity quests
    if (goalType === GoalType.PROXIMITY) {
      if (dto.lat == null || dto.lng == null) {
        throw new BadRequestException('Coordinates required for proximity quest');
      }
      const distance = this.geoService.haversine(
        dto.lat,
        dto.lng,
        doc.lat,
        doc.lng,
      );
      if (distance > 0.1) {
        throw new BadRequestException(
          'Too far from quest location. Must be within 100m.',
        );
      }
    }
    // COUNT and MANUAL: no location check needed

    doc.completedBy = userId;
    doc.completedAt = new Date();
    await doc.save();

    // Award XP
    const baseXp = XP_BY_DIFFICULTY[doc.difficulty ?? Difficulty.MEDIUM] ?? 50;
    const xpResult = await this.dragonService.recordQuestCompletion(
      userId,
      baseXp,
    );

    // Increment user questsCompleted
    await this.userService.incrementQuestsCompleted(userId);

    return { quest: toPlain(doc), xpResult };
  }

  async abandonQuest(questId: string, userId: string) {
    const doc = await this.questModel.findById(questId).exec();
    if (!doc) throw new NotFoundException(`Quest ${questId} not found`);

    if (doc.acceptedBy !== userId) {
      throw new BadRequestException('Quest not accepted by this user');
    }
    if (doc.completedBy) {
      throw new ConflictException('Cannot abandon a completed quest');
    }

    doc.acceptedBy = null;
    doc.acceptedAt = null;
    await doc.save();
    return toPlain(doc);
  }

  async findMyActive(userId: string) {
    const docs = await this.questModel
      .find({ acceptedBy: userId, completedBy: null })
      .sort({ acceptedAt: -1 })
      .exec();
    return docs.map(toPlain);
  }

  async findMyCompleted(userId: string) {
    const docs = await this.questModel
      .find({ completedBy: userId })
      .sort({ completedAt: -1 })
      .exec();
    return docs.map(toPlain);
  }

  getDailyQuests(): any[] {
    // Date-based deterministic selection: same 3 quests for everyone on a given day
    const today = new Date().toDateString();
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const startIdx = hash % (DAILY_QUESTS_POOL.length - 2);

    const BERLIN_LAT = 52.52;
    const BERLIN_LNG = 13.405;

    // Pick 3 quests starting from startIdx
    return [startIdx, startIdx + 1, startIdx + 2].map((i) => {
      const template = DAILY_QUESTS_POOL[i % DAILY_QUESTS_POOL.length];
      return {
        id: `daily-${i}`,
        title: template.title,
        description: template.description,
        lat: BERLIN_LAT,
        lng: BERLIN_LNG,
        address: 'Berlin, Deutschland',
        category: template.category,
        questGiver: { name: 'SideQuest' },
        difficulty: Difficulty.EASY,
        goalType: GoalType.MANUAL,
        goalCount: null,
        reward: null,
        timeLimit: null,
        acceptedBy: null,
        acceptedAt: null,
        completedBy: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
    });
  }
}
