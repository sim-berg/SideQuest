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
import { AchievementService } from '../achievement/achievement.service.js';
import { ReplicateService } from '../achievement/replicate.service.js';
import { Category } from './enums/category.enum.js';
import { SIDEQUEST_TEMPLATES } from './sidequest-templates.js';
import {
  DailySideQuest,
  DailySideQuestDocument,
} from './schemas/daily-sidequest.schema.js';

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
    acceptedBy: obj.acceptedBy ?? null,
    acceptedAt: obj.acceptedAt?.toISOString?.() ?? null,
    completedBy: obj.completedBy ?? null,
    completedAt: obj.completedAt?.toISOString?.() ?? null,
    isSideQuest: obj.isSideQuest ?? false,
    expiresAt: obj.expiresAt?.toISOString?.() ?? null,
    templateId: obj.templateId ?? null,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

// --- SideQuest spawning config ---
const SIDEQUEST_SPAWN_RADIUS_KM = 1.2; // spawns appear within this radius
const SIDEQUEST_MIN_OFFSET_KM = 0.15; // never spawn right on top of the player
const SIDEQUEST_TARGET_ACTIVE = 6; // keep this many open spawns nearby
const EARTH_RADIUS_KM = 6371;

const XP_BY_DIFFICULTY: Record<string, number> = {
  [Difficulty.EASY]: 25,
  [Difficulty.MEDIUM]: 50,
  [Difficulty.HARD]: 100,
};

const DAILY_SIDEQUEST_COUNT = 3; // daily side quests generated per user

// Per-category styling for the generated side quest scene (emoji + gradient
// colors drive the fallback image when no Replicate token is configured).
const SCENE_STYLE: Record<Category, { emoji: string; colors: [string, string] }> =
  {
    [Category.SPORT]: { emoji: '🏃', colors: ['#22c55e', '#0ea5e9'] },
    [Category.SOCIAL]: { emoji: '🤝', colors: ['#3b82f6', '#8b5cf6'] },
    [Category.ADVENTURE]: { emoji: '🧭', colors: ['#f59e0b', '#ef4444'] },
    [Category.SKILL]: { emoji: '🧠', colors: ['#a855f7', '#ec4899'] },
    [Category.MYSTERY]: { emoji: '🔮', colors: ['#6366f1', '#ef4444'] },
  };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function toPlainDaily(doc: DailySideQuestDocument) {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    templateId: obj.templateId,
    title: obj.title,
    description: obj.description,
    category: obj.category,
    difficulty: obj.difficulty,
    xpReward: obj.xpReward,
    completed: obj.completed,
    completedAt: obj.completedAt?.toISOString?.() ?? null,
    date: obj.date,
  };
}

@Injectable()
export class QuestService {
  constructor(
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    @InjectModel(DailySideQuest.name)
    private dailyModel: Model<DailySideQuestDocument>,
    private readonly geoService: GeoService,
    private readonly dragonService: DragonService,
    private readonly userService: UserService,
    private readonly achievementService: AchievementService,
    private readonly replicate: ReplicateService,
  ) {}

  // De-dupes concurrent image requests for the same key so we never kick off
  // two Replicate runs for the same template at once.
  private readonly imageInflight = new Map<string, Promise<string>>();

  /**
   * Illustrative image for a quest's detail modal. Cached by template (so all
   * spawns of the same side quest share one image) and generated lazily.
   */
  async getSideQuestImage(id: string): Promise<{ imageUrl: string }> {
    const doc = await this.questModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Quest ${id} not found`);

    const key = `sq_${doc.templateId ?? doc._id.toString()}`;
    const pending = this.imageInflight.get(key);
    if (pending) return { imageUrl: await pending };

    const style = SCENE_STYLE[doc.category] ?? SCENE_STYLE[Category.ADVENTURE];
    const prompt =
      `Vibrant stylized illustration for a mobile adventure game quest card. ` +
      `Quest: "${doc.title}". ${doc.description} ` +
      `Theme: ${doc.category}. Colorful, dynamic lighting, painterly digital ` +
      `art, epic yet playful mood, no text, no words, no letters.`;

    const task = this.replicate.generateScene({
      key,
      prompt,
      emoji: style.emoji,
      colors: style.colors,
    });
    this.imageInflight.set(key, task);
    try {
      return { imageUrl: await task };
    } finally {
      this.imageInflight.delete(key);
    }
  }

  async findAll(filter: QuestFilterDto) {
    const query: Record<string, unknown> = {};

    // The regular quest list excludes auto-spawned side quests — those have
    // their own discovery endpoint and map layer.
    query.isSideQuest = { $ne: true };

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

  async completeQuest(questId: string, userId: string, lat: number, lng: number) {
    const doc = await this.questModel.findById(questId).exec();
    if (!doc) throw new NotFoundException(`Quest ${questId} not found`);

    if (doc.acceptedBy !== userId) {
      throw new BadRequestException('Quest not accepted by this user');
    }
    if (doc.completedBy) {
      throw new ConflictException('Quest already completed');
    }

    // GPS proximity check (100m)
    const distance = this.geoService.haversine(lat, lng, doc.lat, doc.lng);
    if (distance > 0.1) {
      throw new BadRequestException(
        'Too far from quest location. Must be within 100m.',
      );
    }

    doc.completedBy = userId;
    doc.completedAt = new Date();
    await doc.save();

    // Award XP
    const baseXp = XP_BY_DIFFICULTY[doc.difficulty ?? Difficulty.MEDIUM] ?? 50;
    const xpResult = await this.dragonService.recordQuestCompletion(userId, baseXp);

    // Increment user questsCompleted
    await this.userService.incrementQuestsCompleted(userId);

    // Side quests grant achievements (the SideQuest ↔ Achievement relation).
    const achievements =
      doc.isSideQuest && doc.templateId
        ? await this.achievementService.awardForTemplate(
            userId,
            doc.templateId,
            doc._id.toString(),
          )
        : [];

    return { quest: toPlain(doc), xpResult, achievements };
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

  // --- SideQuests ---------------------------------------------------------

  /**
   * Discovery + lazy spawning for side quests near a point. Despawns expired
   * open spawns, tops up the active pool to the target count, and returns all
   * non-completed side quests within the radius.
   */
  async getNearbySideQuests(lat: number, lng: number, radiusKm?: number) {
    const radius = radiusKm ?? SIDEQUEST_SPAWN_RADIUS_KM;
    const now = new Date();

    // 1. Despawn expired spawns that nobody has accepted.
    await this.questModel
      .deleteMany({
        isSideQuest: true,
        acceptedBy: null,
        expiresAt: { $lt: now },
      })
      .exec();

    // 2. Load all open (un-accepted, non-expired) side quests and keep those
    //    inside the radius.
    const open = await this.questModel
      .find({
        isSideQuest: true,
        acceptedBy: null,
        completedBy: null,
        expiresAt: { $gt: now },
      })
      .exec();

    const nearbyOpen = open.filter(
      (q) => this.geoService.haversine(lat, lng, q.lat, q.lng) <= radius,
    );

    // 3. Top up the pool to the target count.
    const toSpawn = Math.max(0, SIDEQUEST_TARGET_ACTIVE - nearbyOpen.length);
    const spawned: QuestDocument[] = [];
    for (let i = 0; i < toSpawn; i++) {
      spawned.push(await this.spawnSideQuest(lat, lng, radius));
    }

    // 4. Return everything relevant in the radius: freshly spawned + open +
    //    the caller's own accepted (still-running) side quests.
    const all = [...nearbyOpen, ...spawned];
    return all.map(toPlain);
  }

  private async spawnSideQuest(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
  ): Promise<QuestDocument> {
    const template =
      SIDEQUEST_TEMPLATES[
        Math.floor(Math.random() * SIDEQUEST_TEMPLATES.length)
      ];

    const { lat, lng } = this.randomPointAround(centerLat, centerLng, radiusKm);
    const expiresAt = new Date(Date.now() + template.ttlMinutes * 60_000);

    return this.questModel.create({
      title: template.title,
      description: template.description,
      lat,
      lng,
      address: 'In deiner Nähe',
      category: template.category,
      questGiver: template.questGiver,
      reward: template.reward,
      difficulty: template.difficulty,
      isSideQuest: true,
      templateId: template.id,
      expiresAt,
    });
  }

  /** Uniform-ish random point in the ring [minOffset, radius] around a center. */
  private randomPointAround(lat: number, lng: number, radiusKm: number) {
    const min = SIDEQUEST_MIN_OFFSET_KM;
    const max = Math.max(min + 0.05, radiusKm);
    // sqrt for roughly uniform area distribution
    const distanceKm = Math.sqrt(Math.random()) * (max - min) + min;
    const bearing = Math.random() * 2 * Math.PI;

    const latRad = (lat * Math.PI) / 180;
    const dLat = (distanceKm / EARTH_RADIUS_KM) * Math.cos(bearing);
    const dLng =
      (distanceKm / EARTH_RADIUS_KM) *
      Math.sin(bearing) /
      Math.cos(latRad);

    return {
      lat: lat + (dLat * 180) / Math.PI,
      lng: lng + (dLng * 180) / Math.PI,
    };
  }

  // --- Daily SideQuests (per user) ----------------------------------------

  /** Today's daily side quests for a user, generating the set on first call. */
  async getDailySideQuests(userId: string) {
    const date = todayKey();
    let docs = await this.dailyModel
      .find({ userId, date })
      .sort({ createdAt: 1 })
      .exec();

    if (docs.length === 0) {
      docs = await this.generateDailySideQuests(userId, date);
    }
    return docs.map(toPlainDaily);
  }

  private async generateDailySideQuests(userId: string, date: string) {
    // Pick N distinct random templates for the day.
    const pool = [...SIDEQUEST_TEMPLATES];
    const picked: typeof SIDEQUEST_TEMPLATES = [];
    const n = Math.min(DAILY_SIDEQUEST_COUNT, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }

    const created = await Promise.all(
      picked.map((t) =>
        this.dailyModel.create({
          userId,
          date,
          templateId: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          difficulty: t.difficulty,
          xpReward: XP_BY_DIFFICULTY[t.difficulty] ?? 50,
        }),
      ),
    );
    return created.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  /** Self-report completion of a daily side quest → XP + achievement. */
  async completeDailySideQuest(userId: string, id: string) {
    const doc = await this.dailyModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Daily side quest ${id} not found`);
    if (doc.userId !== userId) {
      throw new BadRequestException('Not your daily side quest');
    }
    if (doc.completed) {
      throw new ConflictException('Daily side quest already completed');
    }

    doc.completed = true;
    doc.completedAt = new Date();
    await doc.save();

    const xpResult = await this.dragonService.recordQuestCompletion(
      userId,
      doc.xpReward,
    );
    await this.userService.incrementQuestsCompleted(userId);

    const achievements = await this.achievementService.awardForTemplate(
      userId,
      doc.templateId,
      doc._id.toString(),
      { daily: true },
    );

    return { daily: toPlainDaily(doc), xpResult, achievements };
  }
}
