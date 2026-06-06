import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async sync(@Request() req: any, @Body() body: { lists?: any[]; items?: any[] }) {
    const userId = req.user.userId;
    const lists = body.lists || [];
    const items = body.items || [];
    return this.syncService.syncData(userId, lists, items);
  }
}