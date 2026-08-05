import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CraftDto {
  /** 2–3 item ids, duplicates allowed (e.g. two glasses + one gem). */
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  itemIds: string[];
}
