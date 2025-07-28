import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getUserStats(@Request() req: { user: { id: number } }) {
    const userId = req.user.id;
    return await this.dashboardService.getUserStats(userId);
  }

  @Post('session')
  async recordStudySession(
    @Request() req: { user: { id: number } },
    @Body()
    body: {
      sessionType: string;
      topicName?: string;
      duration?: number;
      pointsEarned?: number;
      sessionData?: any;
    },
  ) {
    const userId = req.user.id;
    const session = await this.dashboardService.recordStudySession(
      userId,
      body.sessionType,
      body.topicName,
      body.duration,
      body.pointsEarned,
      body.sessionData,
    );

    // Update streak
    await this.dashboardService.updateStreak(userId);

    return session;
  }

  @Post('points')
  async addPoints(
    @Request() req: { user: { id: number } },
    @Body() body: { points: number; reason: string },
  ) {
    const userId = req.user.id;
    return await this.dashboardService.addPoints(userId, body.points);
  }

  @Put('stats')
  async updateUserStats(
    @Request() req: { user: { id: number } },
    @Body() updates: any,
  ) {
    const userId = req.user.id;
    return await this.dashboardService.updateUserStats(userId, updates);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return await this.dashboardService.getLeaderboard();
  }
}
