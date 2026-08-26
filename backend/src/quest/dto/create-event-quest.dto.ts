import {
  IsString,
  IsNumber,
  IsEnum,
  IsInt,
  IsOptional,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Category } from '../enums/category.enum.js';

/**
 * A user-organized gathering (e.g. einen Park säubern). The organizer stakes
 * `rewardPerParticipant * maxParticipants` coins into escrow at creation.
 */
export class CreateEventQuestDto {
  @IsString()
  @MaxLength(80)
  title: string;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  address?: string;

  @IsEnum(Category)
  category: Category;

  /** Coins each qualifying participant receives. */
  @IsInt()
  @Min(1)
  @Max(1000)
  rewardPerParticipant: number;

  @IsInt()
  @Min(1)
  @Max(100)
  maxParticipants: number;

  /** Minutes of presence required to qualify. */
  @IsInt()
  @Min(5)
  @Max(480)
  requiredMinutes: number;

  /** How long the event runs from now, in hours. */
  @IsInt()
  @Min(1)
  @Max(72)
  durationHours: number;

  /** Presence radius in meters (default 150). */
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(1000)
  presenceRadiusM?: number;
}
