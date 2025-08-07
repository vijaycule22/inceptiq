import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  CreditTransaction,
  TransactionType,
  ActionType,
} from '../entities/credit-transaction.entity';
import { CreditPackage } from '../entities/credit-package.entity';

@Injectable()
export class CreditService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CreditTransaction)
    private transactionRepository: Repository<CreditTransaction>,
    @InjectRepository(CreditPackage)
    private packageRepository: Repository<CreditPackage>,
  ) {}

  async onModuleInit() {
    // Initialize default packages when the module starts
    await this.initializeDefaultPackages();

    // Add welcome bonus to existing users
    await this.addWelcomeBonusToExistingUsers();
  }

  // Add welcome bonus to all existing users
  async addWelcomeBonusToExistingUsers(): Promise<void> {
    const users = await this.userRepository.find();

    for (const user of users) {
      // Check if user already received welcome bonus (check for any welcome bonus transaction)
      const existingBonus = await this.transactionRepository.findOne({
        where: {
          userId: user.id,
          transactionType: TransactionType.BONUS,
        },
        order: { createdAt: 'ASC' },
      });

      if (!existingBonus) {
        // Add welcome bonus only if user has no bonus transactions at all
        await this.addBonusCredits(user.id, 5, 'Welcome bonus for new user');
        console.log(`✅ Added welcome bonus to user ${user.id}`);
      } else {
        console.log(
          `ℹ️  User ${user.id} already has bonus transactions, skipping welcome bonus`,
        );
      }
    }
  }

  // Credit consumption rates
  private readonly CREDIT_RATES = {
    [ActionType.PDF_UPLOAD]: 2,
    [ActionType.FLASHCARD_GENERATION]: 1,
    [ActionType.QUIZ_GENERATION]: 1,
    [ActionType.AI_CHAT_SESSION]: 2,
    [ActionType.IMAGE_UPLOAD]: 2,
    [ActionType.SUMMARY_GENERATION]: 1,
  };

  async getUserCredits(
    userId: number,
  ): Promise<{ balance: number; earned: number; spent: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    return {
      balance: user.creditBalance,
      earned: user.totalCreditsEarned,
      spent: user.totalCreditsSpent,
    };
  }

  async consumeCredits(
    userId: number,
    actionType: ActionType,
    description?: string,
  ): Promise<boolean> {
    const creditsNeeded = this.CREDIT_RATES[actionType];

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.creditBalance < creditsNeeded) {
      return false; // Insufficient credits
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      transactionType: TransactionType.CONSUMPTION,
      actionType,
      credits: -creditsNeeded,
      description: description || `${actionType} consumption`,
    });

    await this.transactionRepository.save(transaction);

    // Update user balance
    user.creditBalance -= creditsNeeded;
    user.totalCreditsSpent += creditsNeeded;
    await this.userRepository.save(user);

    return true;
  }

  async addCredits(
    userId: number,
    credits: number,
    packageName?: string,
    paymentId?: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      transactionType: TransactionType.PURCHASE,
      credits,
      packageName,
      paymentId,
      description: `Credit purchase: ${packageName || 'Manual addition'}`,
    });

    await this.transactionRepository.save(transaction);

    // Update user balance
    user.creditBalance += credits;
    user.totalCreditsEarned += credits;
    await this.userRepository.save(user);
  }

  async addBonusCredits(
    userId: number,
    credits: number,
    reason: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      transactionType: TransactionType.BONUS,
      credits,
      description: `Bonus credits: ${reason}`,
    });

    await this.transactionRepository.save(transaction);

    // Update user balance
    user.creditBalance += credits;
    user.totalCreditsEarned += credits;
    await this.userRepository.save(user);
  }

  // Add bonus credits for new users
  async addWelcomeBonus(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already received any bonus
    const existingBonus = await this.transactionRepository.findOne({
      where: {
        userId,
        transactionType: TransactionType.BONUS,
      },
    });

    if (existingBonus) {
      console.log(
        `ℹ️  User ${userId} already has bonus transactions, skipping welcome bonus`,
      );
      return; // Already received some bonus
    }

    // Add welcome bonus credits
    await this.addBonusCredits(userId, 5, 'Welcome bonus for new user');
    console.log(`✅ Added welcome bonus to user ${userId}`);
  }

  // Add referral bonus
  async addReferralBonus(userId: number, referrerId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const referrer = await this.userRepository.findOne({
      where: { id: referrerId },
    });

    if (!user || !referrer) {
      throw new Error('User or referrer not found');
    }

    // Add bonus to new user
    await this.addBonusCredits(userId, 3, 'Referral bonus for new user');

    // Add bonus to referrer
    await this.addBonusCredits(
      referrerId,
      2,
      'Referral bonus for existing user',
    );
  }

  async getAvailablePackages(): Promise<CreditPackage[]> {
    return this.packageRepository.find({
      where: { isActive: true },
      order: { credits: 'ASC' },
    });
  }

  async getPackageById(packageId: number): Promise<CreditPackage> {
    const pkg = await this.packageRepository.findOne({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new Error('Package not found');
    }
    return pkg;
  }

  async getTransactionHistory(
    userId: number,
    limit = 20,
  ): Promise<CreditTransaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async checkCreditAvailability(
    userId: number,
    actionType: ActionType,
  ): Promise<{
    hasCredits: boolean;
    requiredCredits: number;
    currentBalance: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const requiredCredits = this.CREDIT_RATES[actionType];
    const hasCredits = user.creditBalance >= requiredCredits;

    return {
      hasCredits,
      requiredCredits,
      currentBalance: user.creditBalance,
    };
  }

  async getCreditUsageStats(userId: number): Promise<{
    totalUploads: number;
    totalFlashcards: number;
    totalQuizzes: number;
    totalChatSessions: number;
    totalImages: number;
    totalSummaries: number;
  }> {
    const transactions = await this.transactionRepository.find({
      where: { userId, transactionType: TransactionType.CONSUMPTION },
    });

    const stats = {
      totalUploads: 0,
      totalFlashcards: 0,
      totalQuizzes: 0,
      totalChatSessions: 0,
      totalImages: 0,
      totalSummaries: 0,
    };

    transactions.forEach((transaction) => {
      switch (transaction.actionType) {
        case ActionType.PDF_UPLOAD:
          stats.totalUploads++;
          break;
        case ActionType.FLASHCARD_GENERATION:
          stats.totalFlashcards++;
          break;
        case ActionType.QUIZ_GENERATION:
          stats.totalQuizzes++;
          break;
        case ActionType.AI_CHAT_SESSION:
          stats.totalChatSessions++;
          break;
        case ActionType.IMAGE_UPLOAD:
          stats.totalImages++;
          break;
        case ActionType.SUMMARY_GENERATION:
          stats.totalSummaries++;
          break;
      }
    });

    return stats;
  }

  // Initialize default packages
  async initializeDefaultPackages(): Promise<void> {
    const existingPackages = await this.packageRepository.count();
    if (existingPackages > 0) return; // Already initialized

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
      const packageEntity = this.packageRepository.create(pkg);
      await this.packageRepository.save(packageEntity);
    }
  }
}
