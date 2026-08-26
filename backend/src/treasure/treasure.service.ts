import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeoService } from '../geo/geo.service.js';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import {
  DailySideQuest,
  DailySideQuestDocument,
} from '../quest/schemas/daily-sidequest.schema.js';
import { getSideQuestTemplate } from '../quest/sidequest-templates.js';
import { Rarity, upgradeRarity } from './enums/rarity.enum.js';
import {
  TREASURE_CATALOG,
  getTreasureItem,
  type TreasureItemDef,
} from './treasure-catalog.js';
import { CRAFTING_RECIPES, type CraftingRecipe } from './crafting-recipes.js';
import { TreasureSpawnerService } from './treasure-spawner.service.js';
import {
  TreasureSpawn,
  TreasureSpawnDocument,
} from './schemas/treasure-spawn.schema.js';
import { UserItem, UserItemDocument } from './schemas/user-item.schema.js';
import { Pet, PetDocument } from '../pet/schemas/pet.schema.js';
import { sumPerkEffects } from '../pet/pet-perks.js';

const MAX_STACK = 3;
const COLLECT_BASE_RADIUS_M = 100;
const COLLECT_MAX_RADIUS_M = 400;
/** Effect scaling per stack level: 1x → 1.5x → 2x. */
const STACK_EFFECT_SCALE = 0.5;

/** Aggregated boni from everything a user carries. */
export interface ActiveBonuses {
  /** Extra player XP as a fraction (0.1 = +10%). */
  xpBoost: number;
  /** Extra dragon XP as a fraction. */
  dragonXp: number;
  /** Chance for a double find when collecting (0–1). */
  luck: number;
  /** Extra treasure collect radius in meters. */
  treasureSenseMeters: number;
}

function toPlainSpawn(doc: TreasureSpawnDocument, item: TreasureItemDef) {
  return {
    id: doc._id.toString(),
    itemId: doc.itemId,
    rarity: doc.rarity,
    lat: doc.lat,
    lng: doc.lng,
    expiresAt: doc.expiresAt.toISOString(),
    item: {
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      rarity: item.rarity,
      target: item.target,
      effects: item.effects,
      lore: item.lore,
    },
  };
}

function toPlainEntry(doc: UserItemDocument, item: TreasureItemDef) {
  const effectiveRarity = upgradeRarity(item.rarity, doc.stackCount - 1);
  const scale = 1 + STACK_EFFECT_SCALE * (doc.stackCount - 1);
  return {
    itemId: doc.itemId,
    stackCount: doc.stackCount,
    effectiveRarity,
    item: {
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      rarity: item.rarity,
      target: item.target,
      lore: item.lore,
      craftOnly: item.craftOnly ?? false,
      effects: item.effects.map((e) => ({
        ...e,
        // surface the stack-scaled value so the UI shows real numbers
        value: e.type === 'cosmetic' ? 0 : e.value * scale,
      })),
    },
    history: (doc.history ?? []).map((h) => ({
      event: h.event,
      date: h.date?.toISOString?.() ?? String(h.date),
      lat: h.lat ?? null,
      lng: h.lng ?? null,
      note: h.note ?? null,
    })),
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

@Injectable()
export class TreasureService {
  constructor(
    @InjectModel(TreasureSpawn.name)
    private readonly spawnModel: Model<TreasureSpawnDocument>,
    @InjectModel(UserItem.name)
    private readonly userItemModel: Model<UserItemDocument>,
    @InjectModel(Quest.name) private readonly questModel: Model<QuestDocument>,
    @InjectModel(DailySideQuest.name)
    private readonly dailyModel: Model<DailySideQuestDocument>,
    @InjectModel(Pet.name) private readonly petModel: Model<PetDocument>,
    private readonly geoService: GeoService,
    private readonly spawner: TreasureSpawnerService,
  ) {}

  /** Active treasure chests around a point. Also marks the area as active. */
  async getNearby(lat: number, lng: number, radiusKm?: number) {
    this.spawner.registerBeacon(lat, lng);
    const radius = radiusKm ?? TreasureSpawnerService.SPAWN_RADIUS_KM;

    const spawns = await this.spawnModel
      .find({ collectedBy: null, expiresAt: { $gt: new Date() } })
      .exec();

    return spawns
      .filter(
        (s) => this.geoService.haversine(lat, lng, s.lat, s.lng) <= radius,
      )
      .flatMap((s) => {
        const item = getTreasureItem(s.itemId);
        return item ? [toPlainSpawn(s, item)] : [];
      });
  }

  /** Everything the user carries, rarest first, plus the aggregated boni. */
  async getInventory(userId: string) {
    const docs = await this.userItemModel
      .find({ userId, stackCount: { $gt: 0 } })
      .exec();

    const items = docs
      .flatMap((doc) => {
        const item = getTreasureItem(doc.itemId);
        return item ? [toPlainEntry(doc, item)] : [];
      })
      .sort(
        (a, b) => rarityRank(b.effectiveRarity) - rarityRank(a.effectiveRarity),
      );

    return { items, bonuses: await this.getActiveBonuses(userId) };
  }

  /** Sum every effect the user's items grant, scaled by stack level. */
  async getActiveBonuses(userId: string): Promise<ActiveBonuses> {
    const docs = await this.userItemModel
      .find({ userId, stackCount: { $gt: 0 } })
      .exec();

    const bonuses: ActiveBonuses = {
      xpBoost: 0,
      dragonXp: 0,
      luck: 0,
      treasureSenseMeters: 0,
    };

    for (const doc of docs) {
      const item = getTreasureItem(doc.itemId);
      if (!item) continue;
      const scale = 1 + STACK_EFFECT_SCALE * (doc.stackCount - 1);
      for (const effect of item.effects) {
        const value = effect.value * scale;
        switch (effect.type) {
          case 'xp_boost':
            bonuses.xpBoost += value;
            break;
          case 'dragon_xp':
            bonuses.dragonXp += value;
            break;
          case 'luck':
            bonuses.luck += value;
            break;
          case 'treasure_sense':
            bonuses.treasureSenseMeters += value;
            break;
          case 'cosmetic':
            break;
        }
      }
    }
    return bonuses;
  }

  /**
   * Combined XP multiplier from carried items — hooked into the quest
   * completion pipeline. Player and dragon share one XP pool, so both
   * effect types feed the same multiplier.
   */
  async getXpMultiplier(userId: string): Promise<number> {
    const bonuses = await this.getActiveBonuses(userId);
    return 1 + bonuses.xpBoost + bonuses.dragonXp;
  }

  /**
   * Pick up a chest: GPS proximity check (extended by Schatz-Sinn items),
   * stack the item (duplicates raise effective rarity, max 3), record the
   * find in the item's history, and roll for a lucky double find.
   */
  async collect(spawnId: string, userId: string, lat: number, lng: number) {
    const spawn = await this.spawnModel.findById(spawnId).exec();
    if (!spawn)
      throw new NotFoundException('Dieser Schatz existiert nicht mehr');
    if (spawn.collectedBy) {
      throw new ConflictException('Dieser Schatz wurde bereits geborgen');
    }
    if (spawn.expiresAt.getTime() < Date.now()) {
      throw new ConflictException('Dieser Schatz ist bereits verschwunden');
    }

    const item = getTreasureItem(spawn.itemId);
    if (!item) throw new NotFoundException('Unbekanntes Item');

    const bonuses = await this.getActiveBonuses(userId);
    // Chain-earned pet perks (Spürsinn etc.) extend the radius alongside items.
    const activePet = await this.petModel
      .findOne({ userId, isActive: true })
      .exec();
    const petSenseMeters = sumPerkEffects(
      activePet?.perks ?? [],
    ).treasureSenseMeters;
    const radiusM = Math.min(
      COLLECT_BASE_RADIUS_M + bonuses.treasureSenseMeters + petSenseMeters,
      COLLECT_MAX_RADIUS_M,
    );
    const distanceKm = this.geoService.haversine(
      lat,
      lng,
      spawn.lat,
      spawn.lng,
    );
    if (distanceKm > radiusM / 1000) {
      throw new BadRequestException(
        `Zu weit entfernt — du musst näher als ${radiusM} m am Schatz sein.`,
      );
    }

    spawn.collectedBy = userId;
    spawn.collectedAt = new Date();
    await spawn.save();

    let entry = await this.userItemModel
      .findOne({ userId, itemId: item.id })
      .exec();

    const stackFull = !!entry && entry.stackCount >= MAX_STACK;
    if (!entry) {
      entry = await this.userItemModel.create({
        userId,
        itemId: item.id,
        stackCount: 1,
        history: [
          { event: 'found', date: new Date(), lat: spawn.lat, lng: spawn.lng },
        ],
      });
    } else if (!stackFull) {
      entry.stackCount += 1;
      entry.history.push({
        event: 'stacked',
        date: new Date(),
        lat: spawn.lat,
        lng: spawn.lng,
        note: `Stufe ${entry.stackCount}/${MAX_STACK}`,
      });
      await entry.save();
    } else {
      // Stack already maxed — the find still goes into the item's history.
      entry.history.push({
        event: 'found',
        date: new Date(),
        lat: spawn.lat,
        lng: spawn.lng,
        note: 'Stapel bereits voll',
      });
      await entry.save();
    }

    // Lucky double find: carried luck can grant one extra stack level.
    let luckyDouble = false;
    if (entry.stackCount < MAX_STACK && Math.random() < bonuses.luck) {
      entry.stackCount += 1;
      entry.history.push({
        event: 'lucky_double',
        date: new Date(),
        note: `Glück! Stufe ${entry.stackCount}/${MAX_STACK}`,
      });
      await entry.save();
      luckyDouble = true;
    }

    return {
      entry: toPlainEntry(entry, item),
      stackFull,
      luckyDouble,
      upgraded: !stackFull && entry.stackCount > 1,
    };
  }

  /** All recipes with unlock + craftable state for the user. */
  async getRecipes(userId: string) {
    const inventory = await this.userItemModel
      .find({ userId, stackCount: { $gt: 0 } })
      .exec();
    const owned = new Map(inventory.map((d) => [d.itemId, d.stackCount]));

    return Promise.all(
      CRAFTING_RECIPES.map(async (recipe) => {
        const unlocked = await this.isRecipeUnlocked(userId, recipe);
        const result = getTreasureItem(recipe.resultItemId)!;
        return {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          unlocked,
          unlockHint: recipe.unlockTemplateId
            ? `Schließe die SideQuest „${
                getSideQuestTemplate(recipe.unlockTemplateId)?.title ?? '???'
              }“ ab, um dieses Rezept freizuschalten.`
            : null,
          craftable:
            unlocked &&
            recipe.ingredients.every(
              (ing) => (owned.get(ing.itemId) ?? 0) >= ing.count,
            ),
          ingredients: recipe.ingredients.map((ing) => {
            const def = getTreasureItem(ing.itemId)!;
            return {
              itemId: ing.itemId,
              count: ing.count,
              name: def.name,
              emoji: def.emoji,
              owned: owned.get(ing.itemId) ?? 0,
            };
          }),
          result: {
            itemId: result.id,
            name: result.name,
            emoji: result.emoji,
            rarity: result.rarity,
          },
        };
      }),
    );
  }

  /**
   * Combine 2–3 items. If the multiset matches an unlocked recipe, the
   * ingredients are consumed and the result lands in the inventory.
   */
  async craft(userId: string, itemIds: string[]) {
    if (!Array.isArray(itemIds) || itemIds.length < 2 || itemIds.length > 3) {
      throw new BadRequestException('Kombiniere 2 bis 3 Items');
    }

    const wanted = countById(itemIds);
    const recipe = CRAFTING_RECIPES.find((r) => {
      const need = new Map(r.ingredients.map((i) => [i.itemId, i.count]));
      if (need.size !== wanted.size) return false;
      for (const [id, count] of need) {
        if (wanted.get(id) !== count) return false;
      }
      return true;
    });

    if (!recipe) {
      throw new BadRequestException(
        'Diese Kombination ergibt nichts. Die Schmiede kennt nur erprobte Rezepte!',
      );
    }
    if (!(await this.isRecipeUnlocked(userId, recipe))) {
      const template = recipe.unlockTemplateId
        ? getSideQuestTemplate(recipe.unlockTemplateId)
        : undefined;
      throw new BadRequestException(
        `Rezept noch nicht freigeschaltet — schließe zuerst die SideQuest „${
          template?.title ?? '???'
        }“ ab.`,
      );
    }

    // Verify everything before touching the inventory.
    const entries = new Map<string, UserItemDocument>();
    for (const ing of recipe.ingredients) {
      const entry = await this.userItemModel
        .findOne({ userId, itemId: ing.itemId })
        .exec();
      if (!entry || entry.stackCount < ing.count) {
        const def = getTreasureItem(ing.itemId)!;
        throw new BadRequestException(
          `Dir fehlt: ${def.emoji} ${def.name} (${ing.count}x benötigt)`,
        );
      }
      entries.set(ing.itemId, entry);
    }

    const resultDef = getTreasureItem(recipe.resultItemId)!;
    const existing = await this.userItemModel
      .findOne({ userId, itemId: resultDef.id })
      .exec();
    if (existing && existing.stackCount >= MAX_STACK) {
      throw new ConflictException(
        `Du trägst bereits die maximale Anzahl von ${resultDef.name}`,
      );
    }

    // Consume ingredients. Emptied stacks keep their history (stackCount 0).
    const ingredientNote = recipe.ingredients
      .map((ing) => `${ing.count}x ${getTreasureItem(ing.itemId)!.name}`)
      .join(' + ');
    for (const ing of recipe.ingredients) {
      const entry = entries.get(ing.itemId)!;
      entry.stackCount -= ing.count;
      entry.history.push({
        event: 'crafted',
        date: new Date(),
        note: `Verschmiedet zu ${resultDef.name}`,
      });
      await entry.save();
    }

    let result = existing;
    if (!result || result.stackCount === 0) {
      if (result) {
        result.stackCount = 1;
        result.history.push({
          event: 'crafted',
          date: new Date(),
          note: `Geschmiedet aus ${ingredientNote}`,
        });
        await result.save();
      } else {
        result = await this.userItemModel.create({
          userId,
          itemId: resultDef.id,
          stackCount: 1,
          history: [
            {
              event: 'crafted',
              date: new Date(),
              note: `Geschmiedet aus ${ingredientNote}`,
            },
          ],
        });
      }
    } else {
      result.stackCount += 1;
      result.history.push({
        event: 'crafted',
        date: new Date(),
        note: `Erneut geschmiedet (Stufe ${result.stackCount}/${MAX_STACK})`,
      });
      await result.save();
    }

    return {
      recipe: { id: recipe.id, name: recipe.name },
      entry: toPlainEntry(result, resultDef),
    };
  }

  /** Full item catalog (for the Kompendium view). */
  getCatalog() {
    return TREASURE_CATALOG.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      rarity: item.rarity,
      target: item.target,
      effects: item.effects,
      lore: item.lore,
      craftOnly: item.craftOnly ?? false,
    }));
  }

  private async isRecipeUnlocked(
    userId: string,
    recipe: CraftingRecipe,
  ): Promise<boolean> {
    if (!recipe.unlockTemplateId) return true;
    const [mapQuest, daily] = await Promise.all([
      this.questModel
        .exists({ completedBy: userId, templateId: recipe.unlockTemplateId })
        .exec(),
      this.dailyModel
        .exists({
          userId,
          templateId: recipe.unlockTemplateId,
          completed: true,
        })
        .exec(),
    ]);
    return !!mapQuest || !!daily;
  }
}

function rarityRank(rarity: Rarity): number {
  return [
    Rarity.BASIC,
    Rarity.UNCOMMON,
    Rarity.RARE,
    Rarity.EPIC,
    Rarity.LEGENDARY,
  ].indexOf(rarity);
}

function countById(ids: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}
