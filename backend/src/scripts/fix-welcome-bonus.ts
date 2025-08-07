import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  CreditTransaction,
  TransactionType,
} from '../entities/credit-transaction.entity';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';

async function fixWelcomeBonus() {
  try {
    // Create a minimal NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the data source
    const dataSource = app.get(DataSource);
    const transactionRepository = dataSource.getRepository(CreditTransaction);
    const userRepository = dataSource.getRepository(User);

    console.log('🔧 Fixing welcome bonus transactions...');

    // Get all users
    const users = await userRepository.find();
    console.log(`Found ${users.length} users to check`);

    for (const user of users) {
      console.log(
        `\n👤 Checking user ${user.id}: ${user.firstName} ${user.lastName}`,
      );
      console.log(`💰 Current balance: ${user.creditBalance} credits`);

      // Find all welcome bonus transactions for this user
      const welcomeBonuses = await transactionRepository.find({
        where: {
          userId: user.id,
          transactionType: TransactionType.BONUS,
          description: 'Bonus credits: Welcome bonus for new user',
        },
        order: { createdAt: 'ASC' },
      });

      console.log(
        `📊 Found ${welcomeBonuses.length} welcome bonus transactions`,
      );

      if (welcomeBonuses.length > 1) {
        console.log(
          `⚠️  User ${user.id} has ${welcomeBonuses.length} welcome bonuses!`,
        );

        // Keep the first one, remove the rest
        const toRemove = welcomeBonuses.slice(1);
        let totalCreditsToRemove = 0;

        for (const transaction of toRemove) {
          totalCreditsToRemove += transaction.credits;
          await transactionRepository.remove(transaction);
          console.log(
            `🗑️  Removed duplicate transaction ${transaction.id} (+${transaction.credits} credits)`,
          );
        }

        // Update user balance
        if (totalCreditsToRemove > 0) {
          user.creditBalance -= totalCreditsToRemove;
          user.totalCreditsEarned -= totalCreditsToRemove;
          await userRepository.save(user);
          console.log(
            `✅ Adjusted user balance by -${totalCreditsToRemove} credits`,
          );
          console.log(`💰 New balance: ${user.creditBalance} credits`);
        }
      } else if (welcomeBonuses.length === 1) {
        console.log(`✅ User ${user.id} has correct welcome bonus`);
      } else {
        console.log(`❌ User ${user.id} has no welcome bonus`);
      }
    }

    console.log('\n✅ Welcome bonus cleanup completed');

    // Close the application
    await app.close();
  } catch (error) {
    console.error('❌ Welcome bonus fix failed:', error);
  }
}

// Run the fix
fixWelcomeBonus();
