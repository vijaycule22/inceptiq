import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TopicService } from './topic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/topics')
@UseGuards(JwtAuthGuard)
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTopic(@Request() req, @UploadedFile() file: any) {
    if (!file || !file.buffer) {
      return { error: 'No file uploaded' };
    }

    const userId = req.user?.id;
    console.log('uploadTopic called with userId:', userId);
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      throw new Error('Invalid userId in uploadTopic: ' + userId);
    }
    const topicName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove file extension

    const topic = await this.topicService.createTopic(
      userId,
      topicName,
      file.buffer,
    );

    return {
      id: topic.id,
      name: topic.name,
      summary: JSON.parse(topic.summary),
      flashcards: JSON.parse(topic.flashcards),
      quiz: JSON.parse(topic.quiz),
      createdAt: topic.createdAt,
    };
  }

  @Get()
  async getUserTopics(@Request() req) {
    const userId = req.user.id;
    const topics = await this.topicService.getUserTopics(userId);

    return topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      summary: JSON.parse(topic.summary),
      flashcards: JSON.parse(topic.flashcards),
      quiz: JSON.parse(topic.quiz),
      createdAt: topic.createdAt,
    }));
  }

  @Get(':id')
  async getTopic(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    const topic = await this.topicService.getTopicById(userId, id);

    if (!topic) {
      return { error: 'Topic not found' };
    }

    return {
      id: topic.id,
      name: topic.name,
      summary: JSON.parse(topic.summary),
      flashcards: JSON.parse(topic.flashcards),
      quiz: JSON.parse(topic.quiz),
      createdAt: topic.createdAt,
    };
  }

  @Delete(':id')
  async deleteTopic(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    await this.topicService.deleteTopic(userId, id);
    return { message: 'Topic deleted successfully' };
  }
}
