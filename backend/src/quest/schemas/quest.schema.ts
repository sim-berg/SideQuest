import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Category } from '../enums/category.enum.js';
import { Difficulty } from '../enums/difficulty.enum.js';
import { GoalType } from '../enums/goal-type.enum.js';
import { QuestType } from '../enums/quest-type.enum.js';

export type QuestDocument = HydratedDocument<Quest>;

@Schema({ timestamps: true })
export class Quest {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, enum: Category })
  category: Category;

  @Prop(
    raw({
      name: { type: String, required: true },
      avatar: { type: String },
    }),
  )
  questGiver: { name: string; avatar?: string };

  @Prop()
  reward?: number;

  @Prop()
  timeLimit?: string;

  @Prop({ default: Difficulty.MEDIUM, enum: Difficulty })
  difficulty: Difficulty;

  @Prop({ default: GoalType.PROXIMITY, enum: GoalType })
  goalType: GoalType;

  @Prop({ type: Number, default: null })
  goalCount: number | null;

  @Prop({ type: String, default: null })
  acceptedBy: string | null;

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: String, default: null })
  completedBy: string | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  // --- Quest type system ---
  @Prop({ default: QuestType.PERSONAL, enum: QuestType, index: true })
  type: QuestType;

  /** User who organized this quest (event quests). */
  @Prop({ type: String, default: null })
  createdBy: string | null;

  // --- Event quest fields (type=event) ---
  /** When the gathering ends; presence and joins stop counting here. */
  @Prop({ type: Date, default: null })
  eventEndsAt: Date | null;

  /** Minutes a participant must be present to qualify for the reward. */
  @Prop({ type: Number, default: null })
  requiredMinutes: number | null;

  /** Radius in meters around the quest location that counts as "there". */
  @Prop({ type: Number, default: null })
  presenceRadiusM: number | null;

  /** Coins each qualifying participant receives from the escrow pool. */
  @Prop({ type: Number, default: null })
  rewardPerParticipant: number | null;

  @Prop({ type: Number, default: null })
  maxParticipants: number | null;

  /** Escrow leftovers refunded to the creator after the event ended. */
  @Prop({ default: false })
  eventFinalized: boolean;

  // --- World quest fields (type=world) ---
  /** Secret QR payload participants scan on site. Never sent to clients. */
  @Prop({ type: String, default: null })
  qrToken: string | null;

  // --- SideQuest fields ---
  // Auto-spawned, ephemeral mini-quests around the player.
  @Prop({ default: false })
  isSideQuest: boolean;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  @Prop({ type: String, default: null })
  templateId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
