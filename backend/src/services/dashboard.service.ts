import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStats } from '../entities/user-stats.entity';
import { Achievement } from '../entities/achievement.entity';
import { StudySession } from '../entities/study-session.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserStats)
    private userStatsRepository: Repository<UserStats>,
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
  ) {}

  async getUserStats(userId: number): Promise<UserStats> {
    let userStats = await this.userStatsRepository.findOne({
      where: { userId },
    });

    if (!userStats) {
      console.log('Creating new UserStats for userId:', userId);
      userStats = this.userStatsRepository.create({
        userId,
        level: 1,
        totalPoints: 0,
        currentLevelPoints: 0,
        pointsToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
        totalStudyTime: 0,
        totalTopics: 0,
        totalQuizzesTaken: 0,
        totalQuizzesPassed: 0,
        totalFlashcardsReviewed: 0,
      });

      try {
        const savedUserStats = await this.userStatsRepository.save(userStats);
        console.log('Saved UserStats:', savedUserStats);

        // Create default achievements
        await this.createDefaultAchievements(savedUserStats.id);

        // Reload without relations to avoid cascade issues
        userStats = await this.userStatsRepository.findOne({
          where: { userId },
        });
      } catch (err) {
        console.error('Failed to create UserStats for userId:', userId, err);
        throw err;
      }
    }

    if (!userStats || !userStats.id) {
      console.error(
        'UserStats is invalid after creation for userId:',
        userId,
        userStats,
      );
      throw new Error(
        'UserStats is invalid after creation for userId: ' + userId,
      );
    }

    // Load achievements for this user
    const achievements = await this.achievementRepository.find({
      where: { userStatsId: userStats.id },
    });

    // Add achievements to the response
    const userStatsWithAchievements = {
      ...userStats,
      achievements,
    };

    console.log(
      'Returning UserStats with achievements:',
      userStatsWithAchievements,
    );
    return userStatsWithAchievements;
  }

  async updateUserStats(
    userId: number,
    updates: Partial<UserStats>,
  ): Promise<UserStats> {
    const userStats = await this.getUserStats(userId);

    // Update the stats
    Object.assign(userStats, updates);

    // Recalculate level and points
    this.recalculateLevel(userStats);

    const savedUserStats = await this.userStatsRepository.save(userStats);

    // Load achievements for this user
    const achievements = await this.achievementRepository.find({
      where: { userStatsId: savedUserStats.id },
    });

    // Return with achievements
    return {
      ...savedUserStats,
      achievements,
    };
  }

  async addPoints(userId: number, points: number): Promise<UserStats> {
    const userStats = await this.getUserStats(userId);

    userStats.totalPoints += points;
    userStats.currentLevelPoints += points;

    // Update last study date
    userStats.lastStudyDate = new Date();

    // Recalculate level based on new total points
    this.recalculateLevel(userStats);

    // Check for achievements
    await this.checkAchievements(userStats);

    const savedUserStats = await this.userStatsRepository.save(userStats);

    // Load achievements for this user
    const achievements = await this.achievementRepository.find({
      where: { userStatsId: savedUserStats.id },
    });

    // Return with achievements
    return {
      ...savedUserStats,
      achievements,
    };
  }

  async recordStudySession(
    userId: number,
    sessionType: string,
    topicName?: string,
    duration?: number,
    pointsEarned?: number,
    sessionData?: any,
  ): Promise<StudySession> {
    const userStats = await this.getUserStats(userId);

    if (!userStats || !userStats.id) {
      // Add detailed logging for debugging
      console.error(
        'UserStats not found or not created for userId:',
        userId,
        userStats,
      );
      throw new Error(
        'UserStats not found or not created for userId: ' + userId,
      );
    }

    console.log('Creating study session for userStats:', userStats.id);

    // Ensure userStatsId is properly set
    const studySessionData = {
      userStatsId: userStats.id,
      sessionType,
      topicName,
      duration: duration || 0,
      pointsEarned: pointsEarned || 0,
      sessionData: sessionData as Record<string, unknown> | undefined,
      startedAt: new Date(),
      completed: true,
      completedAt: new Date(),
    };

    console.log('Study session data to save:', studySessionData);

    const studySession = this.studySessionRepository.create(studySessionData);

    // Double-check that userStatsId is set
    if (!studySession.userStatsId) {
      console.error('Study session created without userStatsId:', studySession);
      throw new Error('Study session must have a valid userStatsId');
    }

    const savedSession = await this.studySessionRepository.save(studySession);

    // Update user stats
    if (duration) {
      userStats.totalStudyTime += duration;
    }
    if (pointsEarned) {
      userStats.totalPoints += pointsEarned;
      userStats.currentLevelPoints += pointsEarned;
    }

    // Update session-specific stats
    switch (sessionType) {
      case 'quiz':
        userStats.totalQuizzesTaken += 1;
        if (
          sessionData &&
          typeof sessionData === 'object' &&
          'passed' in sessionData
        ) {
          const data = sessionData as { passed?: boolean };
          if (data.passed) {
            userStats.totalQuizzesPassed += 1;
          }
        }
        break;
      case 'flashcards':
        if (
          sessionData &&
          typeof sessionData === 'object' &&
          'cardsReviewed' in sessionData
        ) {
          const data = sessionData as { cardsReviewed?: number };
          userStats.totalFlashcardsReviewed += data.cardsReviewed || 0;
        }
        break;
      case 'upload':
        userStats.totalTopics += 1;
        break;
    }

    // Update last study date
    userStats.lastStudyDate = new Date();

    // Recalculate level if points were earned
    if (pointsEarned) {
      this.recalculateLevel(userStats);
    }

    // Save user stats first
    const updatedUserStats = await this.userStatsRepository.save(userStats);

    // Check for achievements after updating stats
    await this.checkAchievements(updatedUserStats);

    return savedSession;
  }

  async updateStreak(userId: number): Promise<UserStats> {
    const userStats = await this.getUserStats(userId);
    const today = new Date();
    const lastStudy = userStats.lastStudyDate;

    if (lastStudy) {
      const daysDiff = Math.floor(
        (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 1) {
        // Consecutive day
        userStats.currentStreak += 1;
        if (userStats.currentStreak > userStats.longestStreak) {
          userStats.longestStreak = userStats.currentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        userStats.currentStreak = 1;
      }
    } else {
      // First study session
      userStats.currentStreak = 1;
    }

    return await this.userStatsRepository.save(userStats);
  }

  private recalculateLevel(userStats: UserStats): void {
    const levels = this.getLevels();
    const currentLevel = levels.find((l) => l.level === userStats.level);
    const nextLevel = levels.find((l) => l.level === userStats.level + 1);

    if (nextLevel && userStats.totalPoints >= nextLevel.pointsRequired) {
      userStats.level = nextLevel.level;
      userStats.currentLevelPoints =
        userStats.totalPoints - nextLevel.pointsRequired;
      userStats.pointsToNextLevel = this.getNextLevelPoints(userStats.level);
    } else if (currentLevel) {
      userStats.currentLevelPoints =
        userStats.totalPoints - currentLevel.pointsRequired;
      userStats.pointsToNextLevel = nextLevel
        ? nextLevel.pointsRequired - currentLevel.pointsRequired
        : 0;
    }
  }

  private async createDefaultAchievements(userStatsId: number): Promise<void> {
    const defaultAchievements = [
      {
        name: 'First Steps',
        description: 'Complete your first study session',
        icon: '🌱',
        points: 10,
        criteria: { type: 'first_session' },
      },
      {
        name: 'Topic Creator',
        description: 'Upload your first topic',
        icon: '📚',
        points: 25,
        criteria: { type: 'upload_topic', count: 1 },
      },
      {
        name: 'Quiz Master',
        description: 'Complete your first quiz',
        icon: '❓',
        points: 15,
        criteria: { type: 'complete_quiz', count: 1 },
      },
      {
        name: 'Flashcard Fan',
        description: 'Review 10 flashcards',
        icon: '💡',
        points: 20,
        criteria: { type: 'review_flashcards', count: 10 },
      },
      {
        name: 'Streak Starter',
        description: 'Maintain a 3-day study streak',
        icon: '🔥',
        points: 30,
        criteria: { type: 'study_streak', count: 3 },
      },
    ];

    for (const achievement of defaultAchievements) {
      await this.achievementRepository.save({
        userStatsId,
        ...achievement,
        unlocked: false,
        progress: 0,
        maxProgress: 100,
      });
    }
  }

  private async checkAchievements(userStats: UserStats): Promise<void> {
    const achievements = await this.achievementRepository.find({
      where: { userStatsId: userStats.id, unlocked: false },
    });

    for (const achievement of achievements) {
      const shouldUnlock = this.evaluateAchievement(achievement, userStats);

      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        achievement.progress = 100;
        await this.achievementRepository.save(achievement);

        // Add achievement points
        userStats.totalPoints += achievement.points;
        userStats.currentLevelPoints += achievement.points;

        // Recalculate level after adding achievement points
        this.recalculateLevel(userStats);
      } else {
        // Update progress
        achievement.progress = this.calculateAchievementProgress(
          achievement,
          userStats,
        );
        await this.achievementRepository.save(achievement);
      }
    }
  }

  private evaluateAchievement(
    achievement: Achievement,
    userStats: UserStats,
  ): boolean {
    const criteria = achievement.criteria as { type: string; count?: number };

    switch (criteria.type) {
      case 'first_session':
        return userStats.totalStudyTime > 0;
      case 'upload_topic':
        return userStats.totalTopics >= (criteria.count ?? 0);
      case 'complete_quiz':
        return userStats.totalQuizzesTaken >= (criteria.count ?? 0);
      case 'review_flashcards':
        return userStats.totalFlashcardsReviewed >= (criteria.count ?? 0);
      case 'study_streak':
        return userStats.currentStreak >= (criteria.count ?? 0);
      default:
        return false;
    }
  }

  private calculateAchievementProgress(
    achievement: Achievement,
    userStats: UserStats,
  ): number {
    const criteria = achievement.criteria as { type: string; count?: number };

    switch (criteria.type) {
      case 'upload_topic':
        return Math.min(
          100,
          (userStats.totalTopics / (criteria.count ?? 1)) * 100,
        );
      case 'complete_quiz':
        return Math.min(
          100,
          (userStats.totalQuizzesTaken / (criteria.count ?? 1)) * 100,
        );
      case 'review_flashcards':
        return Math.min(
          100,
          (userStats.totalFlashcardsReviewed / (criteria.count ?? 1)) * 100,
        );
      case 'study_streak':
        return Math.min(
          100,
          (userStats.currentStreak / (criteria.count ?? 1)) * 100,
        );
      default:
        return 0;
    }
  }

  private getLevels() {
    return [
      { level: 1, name: 'Novice Learner', pointsRequired: 0, badge: '🌱' },
      { level: 2, name: 'Curious Explorer', pointsRequired: 100, badge: '📚' },
      { level: 3, name: 'Dedicated Student', pointsRequired: 250, badge: '🎓' },
      { level: 4, name: 'Knowledge Seeker', pointsRequired: 500, badge: '🔍' },
      {
        level: 5,
        name: 'Learning Enthusiast',
        pointsRequired: 1000,
        badge: '⭐',
      },
      {
        level: 6,
        name: 'Academic Achiever',
        pointsRequired: 2000,
        badge: '🏆',
      },
      { level: 7, name: 'Master Learner', pointsRequired: 3500, badge: '👑' },
      { level: 8, name: 'Knowledge Master', pointsRequired: 5000, badge: '🌟' },
    ];
  }

  private getNextLevelPoints(currentLevel: number): number {
    const levels = this.getLevels();
    const nextLevel = levels.find((l) => l.level === currentLevel + 1);
    const currentLevelData = levels.find((l) => l.level === currentLevel);

    if (nextLevel && currentLevelData) {
      return nextLevel.pointsRequired - currentLevelData.pointsRequired;
    }

    return 0;
  }

  async getLeaderboard() {
    // Get all users with their stats, ordered by total points descending
    const userStats = await this.userStatsRepository
      .createQueryBuilder('userStats')
      .leftJoinAndSelect('userStats.user', 'user')
      .orderBy('userStats.totalPoints', 'DESC')
      .limit(50) // Limit to top 50 users
      .getMany();

    // Transform the data to match the frontend interface
    const leaderboardData = userStats.map((stats, index) => ({
      id: stats.userId,
      firstName: stats.user?.firstName || 'Unknown',
      lastName: stats.user?.lastName || 'User',
      email: stats.user?.email || 'unknown@example.com',
      totalPoints: stats.totalPoints,
      level: stats.level,
      currentStreak: stats.currentStreak,
      totalTopics: stats.totalTopics,
      totalStudyTime: stats.totalStudyTime,
      rank: index + 1,
    }));

    return leaderboardData;
  }
}
