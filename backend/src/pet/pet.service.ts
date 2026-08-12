import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema.js';
import { Element } from './enums/element.enum.js';
import { PetStage } from './enums/pet-stage.enum.js';
import { UserService } from '../user/user.service.js';
import {
  DailySideQuest,
  DailySideQuestDocument,
} from '../quest/schemas/daily-sidequest.schema.js';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import {
  SPECIES,
  ELEMENTS,
  RARITY_WEIGHTS,
  CATEGORY_ELEMENT_AFFINITY,
  getSpeciesDef,
} from './pet-catalog.js';
import { Category } from '../quest/enums/category.enum.js';
import { Rarity } from './enums/rarity.enum.js';
import { sumPerkEffects } from './pet-perks.js';

export function toPlainPet(doc: PetDocument) {
  const obj = doc.toObject();
  const speciesDef = obj.species ? getSpeciesDef(obj.species) : undefined;
  return {
    id: obj._id.toString(),
    userId: obj.userId,
    species: obj.species,
    speciesName: speciesDef?.name ?? null,
    rarity: speciesDef?.rarity ?? null,
    element: obj.element,
    elementName: obj.element ? ELEMENTS[obj.element as Element].name : null,
    name: obj.name ?? null,
    xp: obj.xp,
    stage: obj.stage,
    isActive: obj.isActive,
    obtainedFrom: obj.obtainedFrom,
    soul: obj.soul ?? '',
    perks: obj.perks ?? [],
    hatchedAt: obj.hatchedAt?.toISOString?.() ?? null,
    currentStreak: obj.currentStreak,
    lastStreakDate: obj.lastStreakDate,
    lastQuestCompletedAt: obj.lastQuestCompletedAt?.toISOString?.() ?? null,
    questsCompletedToday: obj.questsCompletedToday,
    lastQuestDate: obj.lastQuestDate,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

export type PlainPet = ReturnType<typeof toPlainPet>;

export interface PetXpResult {
  xpAwarded: number;
  bonusBreakdown: {
    baseXp: number;
    firstOfDayBonus: number;
    streakMultiplier: number;
    streak: number;
    treasureMultiplier: number;
  };
  pet: PlainPet;
}

@Injectable()
export class PetService {
  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectModel(DailySideQuest.name)
    private dailyModel: Model<DailySideQuestDocument>,
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    private readonly userService: UserService,
  ) {}

  /** All pets of a user, starter egg created lazily on first call. */
  async findAllByUser(userId: string): Promise<PlainPet[]> {
    await this.ensureStarterEgg(userId);
    const docs = await this.petModel
      .find({ userId })
      .sort({ isActive: -1, createdAt: 1 })
      .exec();
    return docs.map(toPlainPet);
  }

  async getActive(userId: string): Promise<PetDocument | null> {
    return this.petModel.findOne({ userId, isActive: true }).exec();
  }

  /** Every user owns at least the mystery starter egg. */
  async ensureStarterEgg(userId: string): Promise<void> {
    const count = await this.petModel.countDocuments({ userId }).exec();
    if (count > 0) return;
    await this.petModel.create({
      userId,
      isActive: true,
      obtainedFrom: 'starter',
    });
    await this.userService.setHasDragon(userId);
  }

  /** Grant an additional (inactive) mystery egg, e.g. as a chain reward. */
  async grantEgg(userId: string, obtainedFrom: string): Promise<PlainPet> {
    const doc = await this.petModel.create({
      userId,
      isActive: false,
      obtainedFrom,
    });
    return toPlainPet(doc);
  }

  /**
   * Hatch the user's active egg if there is one: roll element (personalized
   * by quest history when the user is known to the system) and species (by
   * rarity). Returns null when the active pet is not an unhatched egg.
   */
  async hatchReadyEgg(userId: string): Promise<PlainPet | null> {
    const doc = await this.petModel
      .findOne({ userId, isActive: true, species: null })
      .exec();
    if (!doc) return null;

    doc.element = await this.rollElement(userId);
    doc.species = this.rollSpecies();
    doc.stage = this.calculateStage(doc.xp);
    doc.hatchedAt = new Date();
    doc.soul = this.buildFallbackSoul(doc);
    await doc.save();
    return toPlainPet(doc);
  }

  /**
   * Element roll. With no history: uniform. With history: each completed
   * quest in a category adds weight to that category's affine elements, so
   * the hatch reflects how the user actually plays.
   */
  private async rollElement(userId: string): Promise<Element> {
    const weights = new Map<Element, number>(
      Object.values(Element).map((e) => [e, 1]),
    );

    const [dailies, quests] = await Promise.all([
      this.dailyModel.find({ userId, completed: true }).select('category').exec(),
      this.questModel.find({ completedBy: userId }).select('category').exec(),
    ]);
    const categories = [
      ...dailies.map((d) => d.category),
      ...quests.map((q) => q.category),
    ];

    for (const category of categories) {
      const affine = CATEGORY_ELEMENT_AFFINITY[category as Category] ?? [];
      for (const element of affine) {
        weights.set(element, (weights.get(element) ?? 1) + 1);
      }
    }

    return weightedPick(weights);
  }

  private rollSpecies(): string {
    const rarityWeights = new Map<Rarity, number>(
      Object.entries(RARITY_WEIGHTS).map(([r, w]) => [r as Rarity, w]),
    );
    const rarity = weightedPick(rarityWeights);
    const tier = SPECIES.filter((s) => s.rarity === rarity);
    return tier[Math.floor(Math.random() * tier.length)].id;
  }

  /** Placeholder soul; replaced by the LLM-generated one when available. */
  private buildFallbackSoul(doc: PetDocument): string {
    const species = getSpeciesDef(doc.species!)!;
    const element = ELEMENTS[doc.element!];
    return [
      `# Seele von ${species.name} (${element.name})`,
      '',
      `Ein ${element.name}-${species.name}, frisch geschlüpft und voller Neugier.`,
      `Es begleitet seinen Menschen auf allen Quests und wächst mit jedem Abenteuer.`,
      '',
      `- Element: ${element.name} ${element.emoji}`,
      `- Art: ${species.name} ${species.emoji}`,
      `- Wesenszug: aufmerksam, treu und ein wenig verspielt.`,
    ].join('\n');
  }

  async setActive(userId: string, petId: string): Promise<PlainPet> {
    const doc = await this.petModel.findOne({ _id: petId, userId }).exec();
    if (!doc) throw new NotFoundException('Pet nicht gefunden');
    await this.petModel.updateMany({ userId }, { $set: { isActive: false } }).exec();
    doc.isActive = true;
    await doc.save();
    return toPlainPet(doc);
  }

  async rename(userId: string, petId: string, name: string): Promise<PlainPet> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 24) {
      throw new BadRequestException('Name muss 1-24 Zeichen lang sein');
    }
    const doc = await this.petModel.findOne({ _id: petId, userId }).exec();
    if (!doc) throw new NotFoundException('Pet nicht gefunden');
    doc.name = trimmed;
    await doc.save();
    return toPlainPet(doc);
  }

  /**
   * Award quest XP to the active pet: first-of-day bonus, streak multiplier
   * (capped), treasure multiplier. Ported unchanged from the dragon system.
   */
  async recordQuestCompletion(
    userId: string,
    baseXp: number,
    treasureMultiplier = 1,
  ): Promise<PetXpResult | null> {
    await this.ensureStarterEgg(userId);
    const doc = await this.getActive(userId);
    if (!doc) return null;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const isFirstOfDay = doc.lastQuestDate !== today;
    const firstOfDayBonus = isFirstOfDay ? 15 : 0;

    let newStreak = doc.currentStreak;
    if (isFirstOfDay) {
      if (doc.lastStreakDate === yesterday) {
        newStreak = Math.min(doc.currentStreak + 1, 5);
      } else if (doc.lastStreakDate === today) {
        // already counted today, keep
      } else {
        newStreak = 1;
      }
    }

    const streakMultiplier = 1 + newStreak * 0.1;
    // Chain-earned perks join the treasure boosts in one multiplier.
    const perkBoost = sumPerkEffects(doc.perks ?? []).xpBoost;
    const totalXp = Math.round(
      (baseXp + firstOfDayBonus) *
        streakMultiplier *
        (treasureMultiplier + perkBoost),
    );

    doc.xp += totalXp;
    doc.stage = doc.species ? this.calculateStage(doc.xp) : PetStage.EGG;
    doc.currentStreak = newStreak;
    doc.lastStreakDate = today;
    doc.lastQuestCompletedAt = new Date();
    doc.questsCompletedToday = isFirstOfDay ? 1 : doc.questsCompletedToday + 1;
    doc.lastQuestDate = today;
    await doc.save();

    return {
      xpAwarded: totalXp,
      bonusBreakdown: {
        baseXp,
        firstOfDayBonus,
        streakMultiplier,
        streak: newStreak,
        treasureMultiplier,
      },
      pet: toPlainPet(doc),
    };
  }

  /**
   * Post-hatch growth stages. Hatching itself is event-driven (first cleared
   * daily board), so an egg stays an egg regardless of XP.
   */
  calculateStage(xp: number): PetStage {
    if (xp >= 10000) return PetStage.ANCIENT;
    if (xp >= 2000) return PetStage.ADULT;
    if (xp >= 500) return PetStage.JUVENILE;
    return PetStage.HATCHLING;
  }

  /** Summed perk effects of the active pet (earned via quest chains). */
  async getPerkBonuses(
    userId: string,
  ): Promise<{ xpBoost: number; treasureSenseMeters: number }> {
    const doc = await this.getActive(userId);
    return sumPerkEffects(doc?.perks ?? []);
  }
}

function weightedPick<T>(weights: Map<T, number>): T {
  let total = 0;
  for (const w of weights.values()) total += w;
  let roll = Math.random() * total;
  for (const [key, w] of weights) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return [...weights.keys()][0];
}
