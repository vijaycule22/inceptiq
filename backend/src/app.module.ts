import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TopicModule } from './topic/topic.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiChatController } from './controllers/ai-chat.controller';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    TopicModule,
    DashboardModule,
  ],
  controllers: [AppController, AiChatController],
  providers: [AppService],
})
export class AppModule {}
