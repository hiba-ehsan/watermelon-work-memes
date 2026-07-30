import { Controller, Get } from '@nestjs/common';
import { VibeService } from './vibe.service';

@Controller('vibe')
export class VibeController {
  constructor(private readonly vibeService: VibeService) {}

  @Get('memes')
  getMemes() {
    return this.vibeService.getMemes();
  }
}
