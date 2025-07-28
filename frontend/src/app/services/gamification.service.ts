import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  BackendGamificationService,
  BackendUserStats,
  BackendAchievement,
} from './backend-gamification.service';
import { AuthService } from './auth.service';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'upload' | 'study' | 'quiz' | 'streak' | 'special';
}

export interface UserStats {
  totalPoints: number;
  level: number;
  currentLevelPoints: number;
  pointsToNextLevel: number;
  totalTopics: number;
  totalStudyTime: number;
  totalQuizzesTaken: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
}

export interface Level {
  level: number;
  name: string;
  pointsRequired: number;
  badge: string;
  color: string;
}

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  private userStatsSubject = new BehaviorSubject<UserStats>({
    totalPoints: 0,
    level: 1,
    currentLevelPoints: 0,
    pointsToNextLevel: 100,
    totalTopics: 0,
    totalStudyTime: 0,
    totalQuizzesTaken: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: [],
  });
  public userStats$ = this.userStatsSubject.asObservable();

  private levels: Level[] = [
    {
      level: 1,
      name: 'Novice Learner',
      pointsRequired: 0,
      badge: '🌱',
      color: '#6B7280',
    },
    {
      level: 2,
      name: 'Curious Explorer',
      pointsRequired: 100,
      badge: '🔍',
      color: '#3B82F6',
    },
    {
      level: 3,
      name: 'Knowledge Seeker',
      pointsRequired: 250,
      badge: '📚',
      color: '#8B5CF6',
    },
    {
      level: 4,
      name: 'Study Enthusiast',
      pointsRequired: 500,
      badge: '⭐',
      color: '#F59E0B',
    },
    {
      level: 5,
      name: 'Learning Champion',
      pointsRequired: 1000,
      badge: '🏆',
      color: '#EF4444',
    },
    {
      level: 6,
      name: 'Knowledge Master',
      pointsRequired: 2000,
      badge: '👑',
      color: '#10B981',
    },
    {
      level: 7,
      name: 'Learning Legend',
      pointsRequired: 3500,
      badge: '🌟',
      color: '#EC4899',
    },
    {
      level: 8,
      name: 'InceptIQ Sage',
      pointsRequired: 5000,
      badge: '💎',
      color: '#6366F1',
    },
  ];

  constructor(
    private backendService: BackendGamificationService,
    private authService: AuthService
  ) {
    // Listen for authentication changes
    this.authService.currentUser.subscribe((user) => {
      if (user) {
        console.log('User authenticated, loading gamification data...');
        // Check for localStorage migration first
        this.migrateFromLocalStorage();
        // Then load from backend
        this.initializeFromBackend();
      } else {
        console.log('User not authenticated, using default stats');
        this.userStatsSubject.next(this.getDefaultStats());
      }
    });

    // Initialize based on current auth state
    if (this.authService.isLoggedIn()) {
      this.initializeFromBackend();
    } else {
      this.userStatsSubject.next(this.getDefaultStats());
    }
  }

  private initializeFromBackend(): void {
    console.log('Initializing gamification from backend...');

    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No access token found, using default stats');
      this.userStatsSubject.next(this.getDefaultStats());
      return;
    }

    this.backendService.initializeStats().subscribe({
      next: (backendStats) => {
        console.log('Successfully loaded stats from backend:', backendStats);
        console.log('Backend achievements:', backendStats.achievements);
        const convertedStats = this.convertBackendToFrontendStats(backendStats);
        console.log('Converted stats:', convertedStats);
        this.userStatsSubject.next(convertedStats);
      },
      error: (error) => {
        console.error('Failed to load user stats from backend:', error);
        // Fallback to default stats if backend fails
        this.userStatsSubject.next(this.getDefaultStats());
      },
    });
  }

  private convertBackendToFrontendStats(
    backendStats: BackendUserStats
  ): UserStats {
    return {
      totalPoints: backendStats.totalPoints || 0,
      level: backendStats.level || 1,
      currentLevelPoints: backendStats.currentLevelPoints || 0,
      pointsToNextLevel: backendStats.pointsToNextLevel || 100,
      totalTopics: backendStats.totalTopics || 0,
      totalStudyTime: backendStats.totalStudyTime || 0,
      totalQuizzesTaken: backendStats.totalQuizzesTaken || 0,
      currentStreak: backendStats.currentStreak || 0,
      longestStreak: backendStats.longestStreak || 0,
      achievements: this.convertBackendAchievements(backendStats.achievements),
    };
  }

  private convertBackendAchievements(
    backendAchievements: BackendAchievement[] | undefined
  ): Achievement[] {
    if (!backendAchievements || !Array.isArray(backendAchievements)) {
      console.log('No achievements found in backend response, using default');
      return [];
    }

    return backendAchievements.map((backendAchievement) => ({
      id: backendAchievement.id.toString(),
      name: backendAchievement.name,
      description: backendAchievement.description,
      icon: backendAchievement.icon,
      points: backendAchievement.points,
      unlocked: backendAchievement.unlocked,
      unlockedAt: backendAchievement.unlockedAt,
      category: this.determineCategory(backendAchievement.name),
    }));
  }

  private determineCategory(
    achievementName: string
  ): 'upload' | 'study' | 'quiz' | 'streak' | 'special' {
    const name = achievementName.toLowerCase();
    if (
      name.includes('upload') ||
      name.includes('topic') ||
      name.includes('document')
    )
      return 'upload';
    if (
      name.includes('study') ||
      name.includes('learn') ||
      name.includes('time')
    )
      return 'study';
    if (name.includes('quiz') || name.includes('test')) return 'quiz';
    if (name.includes('streak') || name.includes('consistent')) return 'streak';
    return 'special';
  }

  private getDefaultStats(): UserStats {
    return {
      totalPoints: 0,
      level: 1,
      currentLevelPoints: 0,
      pointsToNextLevel: 100,
      totalTopics: 0,
      totalStudyTime: 0,
      totalQuizzesTaken: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
    };
  }

  // Points and Level Management
  addPoints(points: number, reason: string): void {
    this.backendService.addPoints(points, reason).subscribe({
      next: (backendStats) => {
        const convertedStats = this.convertBackendToFrontendStats(backendStats);
        this.userStatsSubject.next(convertedStats);
        this.showPointsNotification(points, reason);

        // Check for level up
        const currentStats = this.userStatsSubject.value;
        if (convertedStats.level > currentStats.level) {
          this.showLevelUpNotification(convertedStats.level);
        }
      },
      error: (error) => {
        console.error('Failed to add points:', error);
        // Fallback to local update
        const currentStats = this.userStatsSubject.value;
        const newTotalPoints = currentStats.totalPoints + points;
        const newLevel = this.calculateLevel(newTotalPoints);
        const currentLevelData =
          this.levels.find((l) => l.level === newLevel) || this.levels[0];
        const nextLevelData = this.levels.find((l) => l.level === newLevel + 1);

        const newStats: UserStats = {
          ...currentStats,
          totalPoints: newTotalPoints,
          level: newLevel,
          currentLevelPoints: newTotalPoints - currentLevelData.pointsRequired,
          pointsToNextLevel: nextLevelData
            ? nextLevelData.pointsRequired - newTotalPoints
            : 0,
        };

        this.userStatsSubject.next(newStats);
        this.showPointsNotification(points, reason);

        if (newLevel > currentStats.level) {
          this.showLevelUpNotification(newLevel);
        }
      },
    });
  }

  private calculateLevel(points: number): number {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (points >= this.levels[i].pointsRequired) {
        return this.levels[i].level;
      }
    }
    return 1;
  }

  // Achievement Management
  unlockAchievement(achievementId: string): void {
    // This will be handled by the backend when conditions are met
    // We don't need to manually unlock achievements as the backend handles this
    console.log('Achievement unlock request:', achievementId);
  }

  // Study Time Tracking
  addStudyTime(minutes: number): void {
    this.backendService
      .recordStudySession({
        sessionType: 'study',
        duration: minutes,
        pointsEarned: Math.floor(minutes / 5) * 5, // 5 points per 5 minutes
        sessionData: { studyTime: minutes },
      })
      .subscribe({
        next: () => {
          // Stats will be updated via the backend service
          this.backendService.getUserStats().subscribe((backendStats) => {
            const convertedStats =
              this.convertBackendToFrontendStats(backendStats);
            this.userStatsSubject.next(convertedStats);
          });
        },
        error: (error) => {
          console.error('Failed to record study time:', error);
          // Fallback to local update
          const currentStats = this.userStatsSubject.value;
          const newStudyTime = currentStats.totalStudyTime + minutes;
          const newStats: UserStats = {
            ...currentStats,
            totalStudyTime: newStudyTime,
          };
          this.userStatsSubject.next(newStats);
        },
      });
  }

  // Quiz Tracking
  addQuizCompletion(score: number): void {
    const pointsEarned = Math.floor(score / 10) * 10; // 10 points per 10% score

    this.backendService
      .recordStudySession({
        sessionType: 'quiz',
        pointsEarned,
        sessionData: {
          score,
          passed: score >= 70, // Consider 70% as passing
        },
      })
      .subscribe({
        next: () => {
          // Stats will be updated via the backend service
          this.backendService.getUserStats().subscribe((backendStats) => {
            const convertedStats =
              this.convertBackendToFrontendStats(backendStats);
            this.userStatsSubject.next(convertedStats);
          });
        },
        error: (error) => {
          console.error('Failed to record quiz completion:', error);
          // Fallback to local update
          const currentStats = this.userStatsSubject.value;
          const newQuizCount = currentStats.totalQuizzesTaken + 1;
          const newStats: UserStats = {
            ...currentStats,
            totalQuizzesTaken: newQuizCount,
          };
          this.userStatsSubject.next(newStats);
        },
      });
  }

  // Topic Tracking
  addTopic(): void {
    this.backendService
      .recordStudySession({
        sessionType: 'upload',
        pointsEarned: 25, // 25 points for uploading a topic
        sessionData: { topicUploaded: true },
      })
      .subscribe({
        next: () => {
          // Stats will be updated via the backend service
          this.backendService.getUserStats().subscribe((backendStats) => {
            const convertedStats =
              this.convertBackendToFrontendStats(backendStats);
            this.userStatsSubject.next(convertedStats);
          });
        },
        error: (error) => {
          console.error('Failed to record topic upload:', error);
          // Fallback to local update
          const currentStats = this.userStatsSubject.value;
          const newTopicCount = currentStats.totalTopics + 1;
          const newStats: UserStats = {
            ...currentStats,
            totalTopics: newTopicCount,
          };
          this.userStatsSubject.next(newStats);
        },
      });
  }

  // Streak Management
  updateStreak(): void {
    // The backend handles streak updates automatically when study sessions are recorded
    // This method is kept for compatibility but doesn't need to do anything
    console.log('Streak update requested - handled by backend');
  }

  // Notification Methods
  private showPointsNotification(points: number, reason: string): void {
    const notification = document.createElement('div');
    notification.className =
      'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `+${points} points! ${reason}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private showLevelUpNotification(level: number): void {
    const levelData = this.levels.find((l) => l.level === level);
    const notification = document.createElement('div');
    notification.className =
      'fixed top-20 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="text-center">
        <div class="text-2xl mb-2">🎉 Level Up! 🎉</div>
        <div class="text-lg">${levelData?.badge} ${levelData?.name}</div>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  private showAchievementNotification(achievement: Achievement): void {
    const notification = document.createElement('div');
    notification.className =
      'fixed top-20 right-4 bg-purple-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="text-center">
        <div class="text-2xl mb-2">🏆 Achievement Unlocked! 🏆</div>
        <div class="text-lg">${achievement.icon} ${achievement.name}</div>
        <div class="text-sm">${achievement.description}</div>
        <div class="text-sm">+${achievement.points} points</div>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Public Methods
  getCurrentStats(): UserStats {
    return this.userStatsSubject.value;
  }

  getLevels(): Level[] {
    return this.levels;
  }

  getAchievements(): Achievement[] {
    return this.userStatsSubject.value.achievements;
  }

  resetProgress(): void {
    // This would need to be implemented on the backend
    console.log('Reset progress requested - not implemented');
  }

  // Method to migrate from localStorage to backend
  migrateFromLocalStorage(): void {
    // Only migrate if user is authenticated
    if (!this.authService.isLoggedIn()) {
      console.log('User not authenticated, skipping migration');
      return;
    }

    const savedStats = localStorage.getItem('inceptiq_user_stats');
    if (savedStats) {
      try {
        const localStats = JSON.parse(savedStats);
        console.log('Migrating stats from localStorage:', localStats);

        // Update backend with local stats
        this.backendService
          .updateUserStats({
            totalPoints: localStats.totalPoints || 0,
            level: localStats.level || 1,
            currentLevelPoints: localStats.currentLevelPoints || 0,
            pointsToNextLevel: localStats.pointsToNextLevel || 100,
            totalTopics: localStats.totalTopics || 0,
            totalStudyTime: localStats.totalStudyTime || 0,
            totalQuizzesTaken: localStats.totalQuizzesTaken || 0,
            currentStreak: localStats.currentStreak || 0,
            longestStreak: localStats.longestStreak || 0,
          })
          .subscribe({
            next: () => {
              console.log('Successfully migrated stats to backend');
              // Clear localStorage after successful migration
              localStorage.removeItem('inceptiq_user_stats');
              localStorage.removeItem('last_study_date');
              // Reload stats from backend
              this.initializeFromBackend();
            },
            error: (error) => {
              console.error('Failed to migrate stats to backend:', error);
            },
          });
      } catch (error) {
        console.error('Error parsing localStorage stats:', error);
      }
    }
  }
}
