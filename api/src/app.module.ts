import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { VibeModule } from './vibe/vibe.module';

@Module({
  imports: [SupabaseModule, VibeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
