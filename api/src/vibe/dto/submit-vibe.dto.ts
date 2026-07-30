import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitVibeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  image_url: string;

  @IsString()
  @IsOptional()
  user_id?: string;
}
