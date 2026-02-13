import { IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Category } from '../enums/category.enum.js';

export class QuestFilterDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsEnum(Category, { each: true })
  categories?: Category[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  paidOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  timedOnly?: boolean;
}
