import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PetMessageDocument = HydratedDocument<PetMessage>;

/** One chat turn between a user and one of their pets. */
@Schema({ timestamps: true })
export class PetMessage {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  petId: string;

  @Prop({ required: true, enum: ['user', 'pet'] })
  role: 'user' | 'pet';

  @Prop({ required: true })
  content: string;

  createdAt: Date;
  updatedAt: Date;
}

export const PetMessageSchema = SchemaFactory.createForClass(PetMessage);
PetMessageSchema.index({ petId: 1, createdAt: -1 });
