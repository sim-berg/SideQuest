import { IsEnum } from 'class-validator';
import { DragonType } from '../enums/dragon-type.enum.js';

export class ChooseDragonDto {
  @IsEnum(DragonType)
  type: DragonType;
}
