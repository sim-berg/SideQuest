import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  QuestChain,
  QuestChainDocument,
  ChainStep,
} from './schemas/quest-chain.schema.js';
import { CHAIN_STORIES, ChainStory } from './chain-stories.js';
import { PERKS } from './pet-perks.js';
import { PetService, PetXpResult, PlainPet } from './pet.service.js';
import { GeoService } from '../geo/geo.service.js';

const EARTH_RADIUS_KM = 6371;
/** How close (km) the player must be to a station to complete it. */
const STEP_PROXIMITY_KM = 0.075;
/** Journeys expire if not finished within two days. */
const CHAIN_TTL_MS = 48 * 60 * 60 * 1000;
/** Base XP for finishing a whole journey. */
const CHAIN_FINALE_XP = 150;
/** Small XP nibble per intermediate station. */
const CHAIN_STEP_XP = 25;

export interface ChainStepView {
  index: number;
  title: string;
  /** Clue text — only for already-revealed steps. */
  clue: string | null;
  lat: number | null;
  lng: number | null;
  completed: boolean;
  completedAt: string | null;
}

export interface ChainView {
  id: string;
  storyId: string;
  title: string;
  intro: string;
  status: string;
  steps: ChainStepView[];
  /** Index of the step the player is currently walking to (null when done). */
  currentStep: number | null;
  /** Revealed only once the journey is completed. */
  conclusion: string | null;
  perk: { id: string; name: string; description: string; emoji: string } | null;
  expiresAt: string;
}

export interface ChainStepResult {
  chain: ChainView;
  finished: boolean;
  xpResult: PetXpResult | null;
  perk: ChainView['perk'];
  egg: PlainPet | null;
}

/**
 * The pet's detective journeys: offering, waypoint generation, in-order GPS
 * step completion, and finale rewards.
 */
@Injectable()
export class ChainService {
  constructor(
    @InjectModel(QuestChain.name)
    private chainModel: Model<QuestChainDocument>,
    private readonly petService: PetService,
    private readonly geoService: GeoService,
  ) {}

  /** The user's current (offered or active, unexpired) journey, if any. */
  async getCurrent(userId: string): Promise<ChainView | null> {
    const doc = await this.findCurrentDoc(userId);
    return doc ? this.toView(doc) : null;
  }

  private async findCurrentDoc(
    userId: string,
  ): Promise<QuestChainDocument | null> {
    const doc = await this.chainModel
      .findOne({ userId, status: { $in: ['offered', 'active'] } })
      .exec();
    if (!doc) return null;
    if (doc.expiresAt.getTime() < Date.now()) {
      doc.status = 'expired';
      await doc.save();
      return null;
    }
    return doc;
  }

  /**
   * Have the pet offer a new journey around the player's position. Returns
   * the existing one when a journey is already running; null while on
   * cooldown (one journey per day) or while the companion is still an egg.
   */
  async offer(
    userId: string,
    lat: number,
    lng: number,
  ): Promise<ChainView | null> {
    const current = await this.findCurrentDoc(userId);
    if (current) return this.toView(current);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Standort erforderlich');
    }

    // Only a hatched companion knows the neighborhood well enough.
    const pet = await this.petService.getActive(userId);
    if (!pet || !pet.species) return null;

    // One journey per day: check the last non-expired chain.
    const today = new Date().toISOString().slice(0, 10);
    const last = await this.chainModel
      .findOne({ userId, status: { $in: ['completed', 'expired'] } })
      .sort({ createdAt: -1 })
      .exec();
    if (last && last.createdAt.toISOString().slice(0, 10) === today) {
      return null;
    }

    // Avoid retelling recent stories.
    const recent = await this.chainModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('storyId')
      .exec();
    const recentIds = new Set(recent.map((c) => c.storyId));
    let pool = CHAIN_STORIES.filter((s) => !recentIds.has(s.id));
    if (pool.length === 0) pool = [...CHAIN_STORIES];
    const story = pool[Math.floor(Math.random() * pool.length)];

    const doc = await this.chainModel.create({
      userId,
      storyId: story.id,
      title: story.title,
      intro: story.intro,
      status: 'offered',
      steps: this.buildWaypoints(story, lat, lng),
      conclusion: story.conclusion,
      perkId: story.perkId,
      eggChance: story.eggChance,
      expiresAt: new Date(Date.now() + CHAIN_TTL_MS),
    });
    return this.toView(doc);
  }

  /**
   * Station layout: a meandering walk of 250-400 m legs. Bearings drift by
   * at most ±75° per leg so the path doesn't zig-zag back on itself, and any
   * point escaping the ~800 m neighborhood is pulled back towards the start.
   */
  private buildWaypoints(
    story: ChainStory,
    originLat: number,
    originLng: number,
  ): ChainStep[] {
    const steps: ChainStep[] = [];
    let lat = originLat;
    let lng = originLng;
    let bearing = Math.random() * 2 * Math.PI;

    for (let i = 0; i < story.steps.length; i++) {
      const legKm = 0.25 + Math.random() * 0.15;
      let next = this.project(lat, lng, bearing, legKm);

      if (
        this.geoService.haversine(originLat, originLng, next.lat, next.lng) >
        0.8
      ) {
        // Turn back towards the origin instead.
        bearing = Math.atan2(originLng - lng, originLat - lat);
        next = this.project(lat, lng, bearing, legKm);
      }

      steps.push({
        index: i,
        title: story.steps[i].title,
        clue: story.steps[i].clue,
        lat: next.lat,
        lng: next.lng,
        completed: false,
        completedAt: null,
      });

      lat = next.lat;
      lng = next.lng;
      bearing += ((Math.random() - 0.5) * 150 * Math.PI) / 180;
    }
    return steps;
  }

  private project(
    lat: number,
    lng: number,
    bearing: number,
    distanceKm: number,
  ): { lat: number; lng: number } {
    const latRad = (lat * Math.PI) / 180;
    const dLat = (distanceKm / EARTH_RADIUS_KM) * Math.cos(bearing);
    const dLng =
      ((distanceKm / EARTH_RADIUS_KM) * Math.sin(bearing)) / Math.cos(latRad);
    return {
      lat: lat + (dLat * 180) / Math.PI,
      lng: lng + (dLng * 180) / Math.PI,
    };
  }

  async accept(userId: string, chainId: string): Promise<ChainView> {
    const doc = await this.getOwned(userId, chainId);
    if (doc.status !== 'offered') {
      throw new BadRequestException('Diese Reise läuft bereits oder ist vorbei');
    }
    doc.status = 'active';
    doc.acceptedAt = new Date();
    await doc.save();
    return this.toView(doc);
  }

  /** Decline an offer (a new one can appear tomorrow). */
  async dismiss(userId: string, chainId: string): Promise<void> {
    const doc = await this.getOwned(userId, chainId);
    if (doc.status !== 'offered') {
      throw new BadRequestException('Nur Angebote können abgelehnt werden');
    }
    doc.status = 'expired';
    await doc.save();
  }

  /** Reach the next station (GPS-checked, strictly in order). */
  async completeStep(
    userId: string,
    chainId: string,
    stepIndex: number,
    lat: number,
    lng: number,
  ): Promise<ChainStepResult> {
    const doc = await this.getOwned(userId, chainId);
    if (doc.status !== 'active') {
      throw new BadRequestException('Diese Reise ist nicht aktiv');
    }
    if (doc.expiresAt.getTime() < Date.now()) {
      doc.status = 'expired';
      await doc.save();
      throw new BadRequestException('Diese Reise ist abgelaufen');
    }

    const current = doc.steps.findIndex((s) => !s.completed);
    if (current === -1 || current !== stepIndex) {
      throw new BadRequestException('Die Stationen müssen der Reihe nach gelöst werden');
    }

    const step = doc.steps[current];
    const distance = this.geoService.haversine(lat, lng, step.lat, step.lng);
    if (distance > STEP_PROXIMITY_KM) {
      throw new BadRequestException(
        `Zu weit entfernt — du musst näher als ${Math.round(STEP_PROXIMITY_KM * 1000)} m an der Station sein.`,
      );
    }

    step.completed = true;
    step.completedAt = new Date();
    doc.markModified('steps');

    const finished = doc.steps.every((s) => s.completed);
    let xpResult: PetXpResult | null = null;
    let perk: ChainView['perk'] = null;
    let egg: PlainPet | null = null;

    if (finished) {
      doc.status = 'completed';
      doc.completedAt = new Date();
      xpResult = await this.petService.recordQuestCompletion(
        userId,
        CHAIN_FINALE_XP,
      );
      perk = await this.grantPerk(userId, doc.perkId);
      if (Math.random() < doc.eggChance) {
        egg = await this.petService.grantEgg(userId, 'chain');
      }
    } else {
      xpResult = await this.petService.recordQuestCompletion(
        userId,
        CHAIN_STEP_XP,
      );
    }

    await doc.save();
    return { chain: this.toView(doc), finished, xpResult, perk, egg };
  }

  private async grantPerk(
    userId: string,
    perkId: string,
  ): Promise<ChainView['perk']> {
    const def = PERKS[perkId];
    if (!def) return null;
    const pet = await this.petService.getActive(userId);
    if (pet && !pet.perks.includes(perkId)) {
      pet.perks.push(perkId);
      await pet.save();
    }
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      emoji: def.emoji,
    };
  }

  private async getOwned(
    userId: string,
    chainId: string,
  ): Promise<QuestChainDocument> {
    const doc = await this.chainModel.findById(chainId).exec();
    if (!doc || doc.userId !== userId) {
      throw new NotFoundException('Reise nicht gefunden');
    }
    return doc;
  }

  /**
   * Serialize for the client: clues and coordinates of not-yet-reached
   * stations stay hidden so the journey remains a mystery.
   */
  private toView(doc: QuestChainDocument): ChainView {
    const firstOpen = doc.steps.findIndex((s) => !s.completed);
    const perkDef = PERKS[doc.perkId];
    return {
      id: doc._id.toString(),
      storyId: doc.storyId,
      title: doc.title,
      intro: doc.intro,
      status: doc.status,
      currentStep: firstOpen === -1 ? null : firstOpen,
      steps: doc.steps.map((s) => {
        const revealed =
          s.completed || (firstOpen !== -1 && s.index <= firstOpen);
        return {
          index: s.index,
          title: revealed ? s.title : '???',
          clue: revealed ? s.clue : null,
          lat: revealed ? s.lat : null,
          lng: revealed ? s.lng : null,
          completed: s.completed,
          completedAt: s.completedAt?.toISOString?.() ?? null,
        };
      }),
      conclusion: doc.status === 'completed' ? doc.conclusion : null,
      perk:
        doc.status === 'completed' && perkDef
          ? {
              id: perkDef.id,
              name: perkDef.name,
              description: perkDef.description,
              emoji: perkDef.emoji,
            }
          : null,
      expiresAt: doc.expiresAt.toISOString(),
    };
  }
}
