import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  shareLocation?: boolean;
}
