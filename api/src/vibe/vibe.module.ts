import { Module } from '@nestjs/common';
import { VibeController } from './vibe.controller';
import { VibeService } from './vibe.service';

@Module({
  controllers: [VibeController],
  providers: [VibeService],
})
export class VibeModule {}
