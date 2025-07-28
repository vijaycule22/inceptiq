import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { UserStats } from '../entities/user-stats.entity';
import { Achievement } from '../entities/achievement.entity';
import { StudySession } from '../entities/study-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserStats, Achievement, StudySession])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
