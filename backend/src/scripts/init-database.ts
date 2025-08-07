import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreditTransaction, TransactionType } from '../entities/credit-transaction.entity';
import { CreditPackage } from '../entities/credit-package.entity';

async function initializeDatabase() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: 'inceptiq.db',
    entities: [User, CreditTransaction, CreditPackage],
    synchronize: true,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Initialize default credit packages
    const packageRepository = dataSource.getRepository(CreditPackage);
    const existingPackages = await packageRepository.count();

    if (existingPackages === 0) {
      const defaultPackages = [
        {
          name: 'Starter',
          credits: 10,
          price: 99.0,
          description: 'Perfect for light users',
          isPopular: false,
          bonusCredits: 0,
        },
        {
          name: 'Explorer',
          credits: 30,
          price: 249.0,
          description: 'Great for regular learners',
          isPopular: true,
          bonusCredits: 5,
        },
        {
          name: 'Pro',
          credits: 100,
          price: 599.0,
          description: 'Ideal for power users',
          isPopular: false,
          bonusCredits: 20,
        },
        {
          name: 'Institutional Pack',
          credits: 500,
          price: 2499.0,
          description: 'Best for teachers and schools',
          isPopular: false,
          bonusCredits: 100,
        },
      ];

      for (const pkg of defaultPackages) {
        const packageEntity = packageRepository.create(pkg);
        await packageRepository.save(packageEntity);
      }

      console.log('✅ Default credit packages initialized');
    } else {
      console.log('ℹ️  Credit packages already exist');
    }

    // Add welcome bonus to existing users
    const userRepository = dataSource.getRepository(User);
    const transactionRepository = dataSource.getRepository(CreditTransaction);

    const users = await userRepository.find();
    for (const user of users) {
      // Check if user already received welcome bonus
      const existingBonus = await transactionRepository.findOne({
        where: {
          userId: user.id,
          transactionType: TransactionType.BONUS,
          description: 'Welcome bonus for new user',
        },
      });

      if (!existingBonus) {
        // Add welcome bonus
        const bonusTransaction = transactionRepository.create({
          userId: user.id,
          transactionType: TransactionType.BONUS,
          credits: 5,
          description: 'Welcome bonus for new user',
        });

        await transactionRepository.save(bonusTransaction);

        // Update user balance
        user.creditBalance += 5;
        user.totalCreditsEarned += 5;
        await userRepository.save(user);

        console.log(`✅ Added welcome bonus to user ${user.id}`);
      }
    }

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the initialization
initializeDatabase();
