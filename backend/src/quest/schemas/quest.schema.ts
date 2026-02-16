import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Category } from '../enums/category.enum.js';

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

  createdAt: Date;
  updatedAt: Date;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
