import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreditService } from '../services/credit.service';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';

async function testCredits() {
  try {
    // Create a minimal NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the services
    const creditService = app.get(CreditService);
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);

    console.log('🧪 Testing credit calculations...');

    // Get the first user
    const user = await userRepository.findOne({ where: { id: 1 } });
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    console.log(`👤 User: ${user.firstName} ${user.lastName}`);
    console.log(`💰 Current balance: ${user.creditBalance} credits`);
    console.log(`📊 Total earned: ${user.totalCreditsEarned} credits`);
    console.log(`💸 Total spent: ${user.totalCreditsSpent} credits`);

    // Test credit availability for different actions
    const actions = [
      { type: 'SUMMARY_GENERATION', cost: 1 },
      { type: 'FLASHCARD_GENERATION', cost: 1 },
      { type: 'QUIZ_GENERATION', cost: 1 },
    ];

    for (const action of actions) {
      const availability = await creditService.checkCreditAvailability(
        user.id,
        action.type as any,
      );
      console.log(`\n🔍 ${action.type}:`);
      console.log(`   Cost: ${action.cost} credit`);
      console.log(`   Has credits: ${availability.hasCredits}`);
      console.log(`   Required: ${availability.requiredCredits}`);
      console.log(`   Current balance: ${availability.currentBalance}`);
    }

    // Test total cost calculation for typical upload
    const summaryCost = 1;
    const flashcardCost = 1;
    const quizCost = 1;
    const totalCost = summaryCost + flashcardCost + quizCost;

    console.log(`\n📋 Typical upload costs:`);
    console.log(`   Summary: ${summaryCost} credit`);
    console.log(`   Flashcards: ${flashcardCost} credit`);
    console.log(`   Quiz: ${quizCost} credit`);
    console.log(`   Total: ${totalCost} credits`);
    console.log(
      `   Remaining after upload: ${user.creditBalance - totalCost} credits`,
    );

    console.log('\n✅ Credit calculation test completed');

    // Close the application
    await app.close();
  } catch (error) {
    console.error('❌ Credit test failed:', error);
  }
}

// Run the test
testCredits();
