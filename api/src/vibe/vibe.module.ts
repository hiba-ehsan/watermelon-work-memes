import { Module } from '@nestjs/common';
import { VibeController } from './vibe.controller';
import { VibeService } from './vibe.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VibeController],
  providers: [VibeService],
})
export class VibeModule {}
