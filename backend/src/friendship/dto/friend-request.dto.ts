import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FriendRequestDto {
  /** A short note that travels with the invitation. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}
