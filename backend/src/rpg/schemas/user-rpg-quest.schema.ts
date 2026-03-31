import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ZoneType } from '../enums/zone-type.enum.js';
import { NpcQuestType } from '../enums/npc-quest-type.enum.js';

export type UserRpgQuestDocument = HydratedDocument<UserRpgQuest>;

@Schema({ timestamps: true })
export class UserRpgQuest {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true, enum: ZoneType })
  zoneType: ZoneType;

  @Prop({ required: true, enum: NpcQuestType })
  questType: NpcQuestType;

  @Prop({ required: true })
  xpReward: number;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserRpgQuestSchema = SchemaFactory.createForClass(UserRpgQuest);
UserRpgQuestSchema.index({ userId: 1, templateId: 1, expiresAt: 1 });
