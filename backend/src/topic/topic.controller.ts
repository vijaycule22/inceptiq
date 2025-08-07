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

// Helper function to safely parse JSON
function safeJsonParse(value: string | null | undefined): any {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  // Handle empty JSON objects or arrays
  const trimmedValue = value.trim();
  if (trimmedValue === '""' || trimmedValue === '[]' || trimmedValue === '{}') {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmedValue);
    // Return null for empty objects/arrays to maintain consistency
    if (
      parsed === null ||
      (Array.isArray(parsed) && parsed.length === 0) ||
      (typeof parsed === 'object' && Object.keys(parsed).length === 0)
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to parse JSON:', error, 'Value:', value);
    return null;
  }
}

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
      summary: safeJsonParse(topic.summary),
      flashcards: safeJsonParse(topic.flashcards),
      quiz: safeJsonParse(topic.quiz),
      createdAt: topic.createdAt,
    };
  }

  @Post('upload-with-options')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTopicWithOptions(@Request() req, @UploadedFile() file: any) {
    if (!file || !file.buffer) {
      return { error: 'No file uploaded' };
    }

    const userId = req.user?.id;
    console.log('uploadTopicWithOptions called with userId:', userId);
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      throw new Error('Invalid userId in uploadTopicWithOptions: ' + userId);
    }

    // Get generation options from request body
    const generateSummary = req.body.generateSummary === 'true';
    const generateFlashcards = req.body.generateFlashcards === 'true';
    const generateQuiz = req.body.generateQuiz === 'true';
    const topicName =
      req.body.topicName || file.originalname.replace(/\.[^/.]+$/, '');

    const topic = await this.topicService.createTopicWithOptions(
      userId,
      topicName,
      file.buffer,
      {
        generateSummary,
        generateFlashcards,
        generateQuiz,
      },
    );

    return {
      id: topic.id,
      name: topic.name,
      summary: safeJsonParse(topic.summary),
      flashcards: safeJsonParse(topic.flashcards),
      quiz: safeJsonParse(topic.quiz),
      createdAt: topic.createdAt,
      hasSummary: topic.hasSummary,
      hasFlashcards: topic.hasFlashcards,
      hasQuiz: topic.hasQuiz,
    };
  }

  @Get()
  async getUserTopics(@Request() req) {
    try {
      const userId = req.user.id;
      console.log('getUserTopics called for userId:', userId);

      const topics = await this.topicService.getUserTopics(userId);
      console.log('Found topics for user:', topics.length);

            return topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        summary: safeJsonParse(topic.summary),
        flashcards: safeJsonParse(topic.flashcards),
        quiz: safeJsonParse(topic.quiz),
        createdAt: topic.createdAt,
        hasSummary: topic.hasSummary,
        hasFlashcards: topic.hasFlashcards,
        hasQuiz: topic.hasQuiz,
      }));
    } catch (error) {
      console.error('Error in getUserTopics:', error);
      throw error;
    }
  }

  @Get(':id')
  async getTopic(@Request() req, @Param('id', ParseIntPipe) id: number) {
    try {
      const userId = req.user.id;
      const topic = await this.topicService.getTopicById(userId, id);

      if (!topic) {
        return { error: 'Topic not found' };
      }

      return {
        id: topic.id,
        name: topic.name,
        summary: safeJsonParse(topic.summary),
        flashcards: safeJsonParse(topic.flashcards),
        quiz: safeJsonParse(topic.quiz),
        createdAt: topic.createdAt,
        hasSummary: topic.hasSummary,
        hasFlashcards: topic.hasFlashcards,
        hasQuiz: topic.hasQuiz,
      };
    } catch (error) {
      console.error('Error in getTopic:', error);
      throw error;
    }
  }

  @Delete(':id')
  async deleteTopic(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    await this.topicService.deleteTopic(userId, id);
    return { message: 'Topic deleted successfully' };
  }
}
