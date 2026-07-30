import { IsString, IsNotEmpty } from 'class-validator';

export class SelectVibeDto {
  @IsString()
  @IsNotEmpty()
  vibe_id: string;
}
