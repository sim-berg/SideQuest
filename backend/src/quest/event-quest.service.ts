import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quest, QuestDocument } from './schemas/quest.schema.js';
import {
  EventParticipation,
  EventParticipationDocument,
} from './schemas/event-participation.schema.js';
import { QuestType } from './enums/quest-type.enum.js';
import { Difficulty } from './enums/difficulty.enum.js';
import type { CreateEventQuestDto } from './dto/create-event-quest.dto.js';
import { GeoService } from '../geo/geo.service.js';
import { CoinService } from '../coin/coin.service.js';
import { escrowAccount } from '../coin/coin.constants.js';
import { PetService } from '../pet/pet.service.js';
import { SoulService } from '../pet/soul.service.js';
import { UserService } from '../user/user.service.js';
import { QuestVectorService } from '../vector/quest-vector.service.js';

const DEFAULT_PRESENCE_RADIUS_M = 150;
/** A heartbeat only accrues presence when the previous one is this fresh. */
const MAX_HEARTBEAT_GAP_MS = 3 * 60_000;
/** Pet XP for a claimed event quest. */
const EVENT_QUEST_XP = 80;

export interface EventParticipationView {
  joined: boolean;
  presenceMinutes: number;
  requiredMinutes: number;
  qualified: boolean;
  rewardPaid: boolean;
  participantCount: number;
  maxParticipants: number;
  eventEndsAt: string | null;
  ended: boolean;
}

/**
 * Event quests: user-organized gatherings with a coin-staked reward pool.
 * The pool (`rewardPerParticipant * maxParticipants`) moves into an escrow
 * account at creation, participants accrue presence through check-in
 * heartbeats inside the radius, qualified participants claim their share,
 * and after the event the organizer reclaims whatever nobody earned.
 */
@Injectable()
export class EventQuestService {
  constructor(
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    @InjectModel(EventParticipation.name)
    private participationModel: Model<EventParticipationDocument>,
    private readonly geoService: GeoService,
    private readonly coinService: CoinService,
    private readonly petService: PetService,
    private readonly soulService: SoulService,
    private readonly userService: UserService,
    private readonly questVector: QuestVectorService,
  ) {}

  async create(userId: string, dto: CreateEventQuestDto) {
    const user = await this.userService.findById(userId);
    const doc = await this.questModel.create({
      title: dto.title,
      description: dto.description,
      lat: dto.lat,
      lng: dto.lng,
      address: dto.address ?? 'Treffpunkt siehe Karte',
      category: dto.category,
      questGiver: { name: user.displayName || user.username },
      type: QuestType.EVENT,
      createdBy: userId,
      difficulty: Difficulty.MEDIUM,
      reward: dto.rewardPerParticipant,
      rewardPerParticipant: dto.rewardPerParticipant,
      maxParticipants: dto.maxParticipants,
      requiredMinutes: dto.requiredMinutes,
      presenceRadiusM: dto.presenceRadiusM ?? DEFAULT_PRESENCE_RADIUS_M,
      eventEndsAt: new Date(Date.now() + dto.durationHours * 3_600_000),
    });

    // Stake the whole pool up front — a claim can then never bounce.
    const pool = dto.rewardPerParticipant * dto.maxParticipants;
    try {
      await this.coinService.transfer(
        userId,
        escrowAccount(doc._id.toString()),
        pool,
        'event_stake',
        { refType: 'quest', refId: doc._id.toString() },
      );
    } catch (err) {
      // Not enough coins — roll the quest back and surface the error.
      await this.questModel.deleteOne({ _id: doc._id }).exec();
      await this.questVector.removeQuests([doc._id.toString()]);
      throw err;
    }

    // Only index once the escrow is funded — a rolled-back quest never
    // becomes searchable.
    void this.questVector.indexNow(doc);
    return doc;
  }

  async join(questId: string, userId: string) {
    const quest = await this.loadEventQuest(questId);
    if (this.hasEnded(quest)) {
      throw new ConflictException('Dieses Event ist bereits vorbei');
    }
    if (quest.createdBy === userId) {
      throw new BadRequestException(
        'Als Organisator nimmst du automatisch teil — die Belohnung ist für deine Gäste.',
      );
    }
    const count = await this.participationModel
      .countDocuments({ questId })
      .exec();
    if (count >= (quest.maxParticipants ?? 0)) {
      throw new ConflictException('Dieses Event ist schon voll');
    }

    try {
      await this.participationModel.create({
        questId,
        userId,
        joinedAt: new Date(),
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Du bist schon dabei');
      }
      throw err;
    }
    return this.getParticipationView(questId, userId);
  }

  /**
   * Presence heartbeat. The frontend pings every ~60s while the user is at
   * the event; time between two sufficiently fresh heartbeats from inside
   * the radius accrues as presence.
   */
  async checkin(questId: string, userId: string, lat: number, lng: number) {
    const quest = await this.loadEventQuest(questId);
    if (this.hasEnded(quest)) {
      throw new ConflictException('Dieses Event ist bereits vorbei');
    }

    const participation = await this.participationModel
      .findOne({ questId, userId })
      .exec();
    if (!participation) {
      throw new BadRequestException('Tritt dem Event zuerst bei');
    }

    const radiusM = quest.presenceRadiusM ?? DEFAULT_PRESENCE_RADIUS_M;
    const distanceKm = this.geoService.haversine(
      lat,
      lng,
      quest.lat,
      quest.lng,
    );
    if (distanceKm > radiusM / 1000) {
      throw new BadRequestException(
        `Du bist zu weit weg — bleib im Umkreis von ${radiusM} m.`,
      );
    }

    const now = new Date();
    const last = participation.lastCheckinAt;
    if (last) {
      const gapMs = now.getTime() - last.getTime();
      if (gapMs <= MAX_HEARTBEAT_GAP_MS) {
        participation.presenceMinutes += gapMs / 60_000;
      }
      // Larger gap: the user left; presence resumes from this heartbeat.
    }
    participation.lastCheckinAt = now;
    await participation.save();

    return this.getParticipationView(questId, userId);
  }

  /** Pay out the participant's share once the required presence is reached. */
  async claim(questId: string, userId: string) {
    const quest = await this.loadEventQuest(questId);
    const participation = await this.participationModel
      .findOne({ questId, userId })
      .exec();
    if (!participation) {
      throw new BadRequestException('Du nimmst an diesem Event nicht teil');
    }
    if (participation.rewardPaid) {
      throw new ConflictException('Belohnung bereits abgeholt');
    }
    const required = quest.requiredMinutes ?? 0;
    if (participation.presenceMinutes < required) {
      const remaining = Math.ceil(required - participation.presenceMinutes);
      throw new BadRequestException(
        `Noch nicht geschafft — bleib noch ca. ${remaining} min vor Ort.`,
      );
    }

    participation.rewardPaid = true;
    await participation.save();

    const coins = quest.rewardPerParticipant ?? 0;
    try {
      await this.coinService.transfer(
        escrowAccount(questId),
        userId,
        coins,
        'event_reward',
        { refType: 'quest', refId: questId },
      );
    } catch (err) {
      participation.rewardPaid = false;
      await participation.save();
      throw err;
    }

    // An earned event counts as a completed quest: XP, stats, soul.
    const xpResult = await this.petService.recordQuestCompletion(
      userId,
      EVENT_QUEST_XP,
      { category: quest.category },
    );
    await this.userService.incrementQuestsCompleted(userId);
    void this.soulService.refreshUserSoul(userId);

    return {
      coins,
      xpResult,
      participation: await this.getParticipationView(questId, userId),
    };
  }

  /** After the event: refund the unclaimed rest of the pool to the organizer. */
  async finalize(questId: string, userId: string) {
    const quest = await this.loadEventQuest(questId);
    if (quest.createdBy !== userId) {
      throw new BadRequestException(
        'Nur der Organisator kann das Event abschließen',
      );
    }
    if (!this.hasEnded(quest)) {
      throw new BadRequestException('Das Event läuft noch');
    }
    if (quest.eventFinalized) {
      throw new ConflictException('Event bereits abgeschlossen');
    }

    quest.eventFinalized = true;
    await quest.save();

    const leftover = await this.coinService.getBalance(escrowAccount(questId));
    if (leftover > 0) {
      await this.coinService.transfer(
        escrowAccount(questId),
        userId,
        leftover,
        'event_refund',
        { refType: 'quest', refId: questId },
      );
    }
    return { refunded: leftover };
  }

  async getParticipationView(
    questId: string,
    userId: string,
  ): Promise<EventParticipationView> {
    const quest = await this.loadEventQuest(questId);
    const [participation, participantCount] = await Promise.all([
      this.participationModel.findOne({ questId, userId }).exec(),
      this.participationModel.countDocuments({ questId }).exec(),
    ]);

    const required = quest.requiredMinutes ?? 0;
    const minutes = participation?.presenceMinutes ?? 0;
    return {
      joined: !!participation,
      presenceMinutes: Math.round(minutes * 10) / 10,
      requiredMinutes: required,
      qualified: !!participation && minutes >= required,
      rewardPaid: participation?.rewardPaid ?? false,
      participantCount,
      maxParticipants: quest.maxParticipants ?? 0,
      eventEndsAt: quest.eventEndsAt?.toISOString() ?? null,
      ended: this.hasEnded(quest),
    };
  }

  private async loadEventQuest(questId: string): Promise<QuestDocument> {
    const quest = await this.questModel.findById(questId).exec();
    if (!quest) throw new NotFoundException(`Quest ${questId} not found`);
    if (quest.type !== QuestType.EVENT) {
      throw new BadRequestException('Das ist kein Event-Quest');
    }
    return quest;
  }

  private hasEnded(quest: QuestDocument): boolean {
    return !!quest.eventEndsAt && quest.eventEndsAt.getTime() < Date.now();
  }
}
