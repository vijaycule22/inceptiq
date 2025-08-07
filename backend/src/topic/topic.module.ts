import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { UserStats } from '../entities/user-stats.entity';
import { Achievement } from '../entities/achievement.entity';
import { StudySession } from '../entities/study-session.entity';
import { DashboardService } from '../services/dashboard.service';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      User,
      UserStats,
      Achievement,
      StudySession,
    ]),
    CreditModule,
  ],
  controllers: [TopicController],
  providers: [TopicService, DashboardService],
  exports: [TopicService],
})
export class TopicModule {}
