import {
  IsBoolean,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '../enums/category.enum.js';
import { Difficulty } from '../enums/difficulty.enum.js';
import { GoalType } from '../enums/goal-type.enum.js';

export class QuestGiverDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class CreateQuestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsString()
  address: string;

  @IsEnum(Category)
  category: Category;

  @IsObject()
  @ValidateNested()
  @Type(() => QuestGiverDto)
  questGiver: QuestGiverDto;

  @IsOptional()
  @IsNumber()
  reward?: number;

  @IsOptional()
  @IsDateString()
  timeLimit?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(GoalType)
  goalType?: GoalType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  goalCount?: number;

  /** Publish under the author's pseudonym instead of their username. */
  @IsOptional()
  @IsBoolean()
  usePseudonym?: boolean;
}
