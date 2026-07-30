import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VibeService } from './vibe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitVibeDto } from './dto/submit-vibe.dto';
import { SelectVibeDto } from './dto/select-vibe.dto';

@Controller('vibe')
export class VibeController {
  constructor(private readonly vibeService: VibeService) {}

  @Get('memes')
  getMemes() {
    return this.vibeService.getMemes();
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submit(@Body() dto: SubmitVibeDto, @Request() req: any) {
    return this.vibeService.submit(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('select')
  async select(@Body() dto: SelectVibeDto, @Request() req: any) {
    return this.vibeService.select(dto.vibe_id, req.user.id);
  }
}
