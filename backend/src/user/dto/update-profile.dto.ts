import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CHARACTER_CLASS_IDS } from '../character-classes.js';

export class ProfileLinkDto {
  @IsString()
  @MaxLength(40)
  label: string;

  /** http(s) only — anything else could smuggle javascript: into a click. */
  @IsString()
  @MaxLength(300)
  @Matches(/^https?:\/\/\S+$/i, {
    message: 'url must start with http:// or https://',
  })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  icon?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(48)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  /** User-authored CSS for the profile card; sanitized in the service. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  profileCss?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  /** Alias for pseudonymous quests; empty string clears it. */
  @IsOptional()
  @IsString()
  @MaxLength(24)
  pseudonym?: string;

  @IsOptional()
  @IsBoolean()
  shareLocation?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  status?: string;

  @IsOptional()
  @IsBoolean()
  openForQuests?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['', ...CHARACTER_CLASS_IDS])
  characterClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  homeRegion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(#[0-9a-f]{6})?$/i, { message: 'accentColor must be #rrggbb' })
  accentColor?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ProfileLinkDto)
  links?: ProfileLinkDto[];

  /** Emblem keys to pin; filtered to what the user actually earned. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  featuredEmblems?: string[];
}
