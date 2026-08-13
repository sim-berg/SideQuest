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
import { PetService } from '../pet/pet.service.js';
import { SoulService } from '../pet/soul.service.js';
import { PetQuestmasterService } from '../pet/pet-questmaster.service.js';
import { UserService } from '../user/user.service.js';
import { AchievementService } from '../achievement/achievement.service.js';
import { ReplicateService } from '../achievement/replicate.service.js';
import { TreasureService } from '../treasure/treasure.service.js';
import { Category } from './enums/category.enum.js';
import { SIDEQUEST_TEMPLATES } from './sidequest-templates.js';
import {
  DAILY_QUEST_TEMPLATES,
  type DailyQuestTemplate,
} from './daily-templates.js';
import {
  DailySideQuest,
  DailySideQuestDocument,
} from './schemas/daily-sidequest.schema.js';
import { GoalType } from './enums/goal-type.enum.js';
import { QuestType } from './enums/quest-type.enum.js';
import type { CompleteQuestDto } from './dto/complete-quest.dto.js';
import { DAILY_QUESTS_POOL } from './data/daily-quests.data.js';
import { CoinService } from '../coin/coin.service.js';
import { DAILY_COIN_REWARD } from '../coin/coin.constants.js';

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
    isSideQuest: obj.isSideQuest ?? false,
    expiresAt: obj.expiresAt?.toISOString?.() ?? null,
    templateId: obj.templateId ?? null,
    type: obj.type ?? QuestType.PERSONAL,
    createdBy: obj.createdBy ?? null,
    eventEndsAt: obj.eventEndsAt?.toISOString?.() ?? null,
    requiredMinutes: obj.requiredMinutes ?? null,
    presenceRadiusM: obj.presenceRadiusM ?? null,
    rewardPerParticipant: obj.rewardPerParticipant ?? null,
    maxParticipants: obj.maxParticipants ?? null,
    eventFinalized: obj.eventFinalized ?? false,
    // The QR secret stays server-side; clients only learn one exists.
    hasQr: !!obj.qrToken,
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
// Don't hand out a template again while it is still fresh in memory.
const DAILY_REPEAT_COOLDOWN_DAYS = 10;
// Difficulty shape of a day's board: keep it comfortably clearable.
const DAILY_DIFFICULTY_PLAN = [
  Difficulty.EASY,
  Difficulty.EASY,
  Difficulty.MEDIUM,
];
// Extra XP for clearing the whole board — the reward for securing the day.
const DAILY_BOARD_BONUS_XP = 40;

// Per-category styling for the generated side quest scene (emoji + gradient
// colors drive the fallback image when no Replicate token is configured).
const SCENE_STYLE: Record<
  Category,
  { emoji: string; colors: [string, string] }
> = {
  [Category.SPORT]: { emoji: '🏃', colors: ['#22c55e', '#0ea5e9'] },
  [Category.SOCIAL]: { emoji: '🤝', colors: ['#3b82f6', '#8b5cf6'] },
  [Category.ADVENTURE]: { emoji: '🧭', colors: ['#f59e0b', '#ef4444'] },
  [Category.SKILL]: { emoji: '🧠', colors: ['#a855f7', '#ec4899'] },
  [Category.MYSTERY]: { emoji: '🔮', colors: ['#6366f1', '#ef4444'] },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/** The day bucket `days` days before `date` (YYYY-MM-DD). */
function daysBefore(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
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
    emoji: obj.emoji ?? '',
    xpReward: obj.xpReward,
    completed: obj.completed,
    completedAt: obj.completedAt?.toISOString?.() ?? null,
    date: obj.date,
  };
}

/** Today's daily quests plus the streak they feed. */
export interface DailyBoardView {
  date: string;
  quests: ReturnType<typeof toPlainDaily>[];
  completed: number;
  total: number;
  allDone: boolean;
  streak: number;
  longestStreak: number;
  /** Today already counted towards the streak. */
  secured: boolean;
}

@Injectable()
export class QuestService {
  constructor(
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    @InjectModel(DailySideQuest.name)
    private dailyModel: Model<DailySideQuestDocument>,
    private readonly geoService: GeoService,
    private readonly petService: PetService,
    private readonly soulService: SoulService,
    private readonly petQuestmaster: PetQuestmasterService,
    private readonly userService: UserService,
    private readonly achievementService: AchievementService,
    private readonly replicate: ReplicateService,
    private readonly treasureService: TreasureService,
    private readonly coinService: CoinService,
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
    if (filter.types?.length) {
      // Legacy quests predate the type field and count as personal.
      query.$or = filter.types.includes(QuestType.PERSONAL)
        ? [{ type: { $in: filter.types } }, { type: { $exists: false } }]
        : [{ type: { $in: filter.types } }];
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

  async completeQuest(questId: string, userId: string, dto: CompleteQuestDto) {
    const doc = await this.questModel.findById(questId).exec();
    if (!doc) throw new NotFoundException(`Quest ${questId} not found`);

    // Event and world quests have their own flows (presence / QR redeem).
    if (doc.type === QuestType.EVENT || doc.type === QuestType.WORLD) {
      throw new BadRequestException(
        'Dieses Quest wird über Teilnahme bzw. QR-Code abgeschlossen',
      );
    }
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
        throw new BadRequestException(
          'Coordinates required for proximity quest',
        );
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

    // Award XP — carried treasure items can boost the multiplier
    const baseXp = XP_BY_DIFFICULTY[doc.difficulty ?? Difficulty.MEDIUM] ?? 50;
    const treasureMultiplier =
      await this.treasureService.getXpMultiplier(userId);
    const xpResult = await this.petService.recordQuestCompletion(
      userId,
      baseXp,
      { category: doc.category, treasureMultiplier },
    );

    // Quests with a posted reward pay out in coins.
    const coinsAwarded = doc.reward && doc.reward > 0 ? doc.reward : 0;
    if (coinsAwarded > 0) {
      await this.coinService.mint(userId, coinsAwarded, 'quest_reward', {
        refType: 'quest',
        refId: doc._id.toString(),
      });
    }

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

    return { quest: toPlain(doc), xpResult, achievements, coinsAwarded };
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
      ((distanceKm / EARTH_RADIUS_KM) * Math.sin(bearing)) / Math.cos(latRad);

    return {
      lat: lat + (dLat * 180) / Math.PI,
      lng: lng + (dLng * 180) / Math.PI,
    };
  }

  // --- Daily SideQuests (per user) ----------------------------------------

  /** Today's daily quest board for a user, generating the set on first call. */
  async getDailySideQuests(userId: string): Promise<DailyBoardView> {
    const date = todayKey();
    let docs = await this.dailyModel
      .find({ userId, date })
      .sort({ createdAt: 1 })
      .exec();

    if (docs.length === 0) {
      docs = await this.generateDailySideQuests(userId, date);
    }
    return this.buildBoard(userId, date, docs);
  }

  private async buildBoard(
    userId: string,
    date: string,
    docs: DailySideQuestDocument[],
  ): Promise<DailyBoardView> {
    const quests = docs.map(toPlainDaily);
    const completed = quests.filter((q) => q.completed).length;
    const { streak, longestStreak, securedToday } =
      await this.userService.getDailyQuestStreak(userId);

    return {
      date,
      quests,
      completed,
      total: quests.length,
      allDone: quests.length > 0 && completed === quests.length,
      streak,
      longestStreak,
      secured: securedToday,
    };
  }

  /**
   * Draw a day's board. When the user's companion has hatched and an LLM is
   * configured, the pet writes a personalized set from both soul.md files;
   * otherwise (or on any failure) fall back to the static template pool,
   * shaped by DAILY_DIFFICULTY_PLAN so a day is always clearable.
   */
  private async generateDailySideQuests(userId: string, date: string) {
    const recent = await this.dailyModel
      .find({
        userId,
        date: { $gte: daysBefore(date, DAILY_REPEAT_COOLDOWN_DAYS) },
      })
      .select('templateId title')
      .exec();
    const onCooldown = new Set(recent.map((d) => d.templateId));

    const generated = await this.petQuestmaster.generateDailyQuests(
      userId,
      recent.map((d) => d.title),
    );
    if (generated) {
      const created = await Promise.all(
        generated.map((g, i) =>
          this.dailyModel.create({
            userId,
            date,
            templateId: `pet_${date}_${i}`,
            title: g.title,
            description: g.description,
            category: g.category,
            difficulty: g.difficulty,
            emoji: g.emoji,
            xpReward: XP_BY_DIFFICULTY[g.difficulty] ?? 50,
          }),
        ),
      );
      return created.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    }

    let pool = DAILY_QUEST_TEMPLATES.filter((t) => !onCooldown.has(t.id));
    // Tiny pool left (long streak, short cooldown window) — fall back to all.
    if (pool.length < DAILY_SIDEQUEST_COUNT) pool = [...DAILY_QUEST_TEMPLATES];

    const picked: DailyQuestTemplate[] = [];
    const takeRandom = (candidates: DailyQuestTemplate[]) => {
      if (candidates.length === 0) return;
      const t = candidates[Math.floor(Math.random() * candidates.length)];
      picked.push(t);
      pool = pool.filter((p) => p.id !== t.id);
    };

    for (const difficulty of DAILY_DIFFICULTY_PLAN.slice(
      0,
      DAILY_SIDEQUEST_COUNT,
    )) {
      const sameDifficulty = pool.filter((t) => t.difficulty === difficulty);
      takeRandom(sameDifficulty.length > 0 ? sameDifficulty : pool);
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
          emoji: t.emoji,
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

    // Was this the last open quest of the day? If so the day is secured: the
    // streak advances and the board bonus rides along on this XP award.
    const docs = await this.dailyModel
      .find({ userId, date: doc.date })
      .sort({ createdAt: 1 })
      .exec();
    const boardCleared = docs.every((d) => d.completed);
    const streakBefore = await this.userService.getDailyQuestStreak(userId);
    const alreadySecured = streakBefore.securedToday;
    const bonusXp = boardCleared && !alreadySecured ? DAILY_BOARD_BONUS_XP : 0;

    const xpResult = await this.petService.recordQuestCompletion(
      userId,
      doc.xpReward + bonusXp,
      {
        category: doc.category,
        treasureMultiplier: await this.treasureService.getXpMultiplier(userId),
      },
    );
    await this.userService.incrementQuestsCompleted(userId);

    // Small coin drop per daily — the everyday faucet of the economy.
    const coinsAwarded = DAILY_COIN_REWARD[doc.difficulty] ?? 5;
    await this.coinService.mint(userId, coinsAwarded, 'daily_reward', {
      refType: 'daily',
      refId: doc._id.toString(),
    });

    const achievements = await this.achievementService.awardForTemplate(
      userId,
      doc.templateId,
      doc._id.toString(),
      { daily: true },
    );

    // Clearing a full board is what hatches the mystery egg — the pet's
    // "birth" is earned by securing a day, not by grinding XP.
    let hatch: Awaited<ReturnType<PetService['hatchReadyEgg']>> = null;
    if (boardCleared) {
      const streakInfo = await this.userService.recordDailyBoardCleared(
        userId,
        doc.date,
      );
      achievements.push(
        ...(await this.achievementService.awardDailyStreakMilestones(
          userId,
          streakInfo.streak,
        )),
      );
      hatch = await this.petService.hatchReadyEgg(userId);
      // Background soul work: an LLM-written personality for the newborn and
      // a refreshed play-style profile of the user. Both are best-effort.
      if (hatch) void this.soulService.upgradePetSoul(hatch.id);
      void this.soulService.refreshUserSoul(userId);
    }

    return {
      daily: toPlainDaily(doc),
      xpResult,
      achievements,
      bonusXp,
      coinsAwarded,
      hatch,
      board: await this.buildBoard(userId, doc.date, docs),
    };
  }

  // --- Global daily quests (same three for everyone, from develop) ---------

  getDailyQuests(): any[] {
    // Date-based deterministic selection: same 3 quests for everyone on a given day
    const today = new Date().toDateString();
    const hash = today
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
