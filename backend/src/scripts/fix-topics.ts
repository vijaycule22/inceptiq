import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Topic } from '../entities/topic.entity';
import { DataSource } from 'typeorm';

async function fixTopics() {
  try {
    // Create a minimal NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the data source
    const dataSource = app.get(DataSource);
    const topicRepository = dataSource.getRepository(Topic);

    console.log('🔧 Starting topic data cleanup...');

    // Get all topics
    const topics = await topicRepository.find();
    console.log(`Found ${topics.length} topics to check`);

    let fixedCount = 0;

    for (const topic of topics) {
      let needsUpdate = false;

      // Check and fix summary
      if (
        topic.summary &&
        (topic.summary.trim() === '' || topic.summary.trim() === '""')
      ) {
        topic.summary = '';
        needsUpdate = true;
      }

      // Check and fix flashcards
      if (
        topic.flashcards &&
        (topic.flashcards.trim() === '' || topic.flashcards.trim() === '""')
      ) {
        topic.flashcards = '';
        needsUpdate = true;
      }

      // Check and fix quiz
      if (
        topic.quiz &&
        (topic.quiz.trim() === '' || topic.quiz.trim() === '""')
      ) {
        topic.quiz = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await topicRepository.save(topic);
        fixedCount++;
        console.log(`✅ Fixed topic ${topic.id}: ${topic.name}`);
      }
    }

    console.log(`✅ Cleanup completed. Fixed ${fixedCount} topics.`);

    // Close the application
    await app.close();
  } catch (error) {
    console.error('❌ Topic cleanup failed:', error);
  }
}

// Run the cleanup
fixTopics();
