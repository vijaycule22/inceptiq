import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserStats {
  id: number;
  userId: number;
  level: number;
  totalPoints: number;
  currentLevelPoints: number;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number;
  totalTopics: number;
  totalQuizzesTaken: number;
  totalQuizzesPassed: number;
  totalFlashcardsReviewed: number;
  lastStudyDate: string;
  weeklyProgress: any;
  monthlyProgress: any;
  achievements: Achievement[];
  studySessions: StudySession[];
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: number;
  userStatsId: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt: string;
  criteria: any;
  progress: number;
  maxProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: number;
  userStatsId: number;
  sessionType: string;
  topicName: string;
  duration: number;
  pointsEarned: number;
  sessionData: any;
  completed: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/dashboard/stats`);
  }

  recordStudySession(
    sessionType: string,
    topicName?: string,
    duration?: number,
    pointsEarned?: number,
    sessionData?: any
  ): Observable<StudySession> {
    return this.http.post<StudySession>(`${this.apiUrl}/dashboard/session`, {
      sessionType,
      topicName,
      duration,
      pointsEarned,
      sessionData,
    });
  }

  addPoints(points: number, reason: string): Observable<UserStats> {
    return this.http.post<UserStats>(`${this.apiUrl}/dashboard/points`, {
      points,
      reason,
    });
  }

  updateUserStats(updates: Partial<UserStats>): Observable<UserStats> {
    return this.http.put<UserStats>(`${this.apiUrl}/dashboard/stats`, updates);
  }

  // Helper methods for calculating progress
  getLevelProgress(userStats: UserStats): number {
    if (userStats.pointsToNextLevel === 0) return 100;
    return (userStats.currentLevelPoints / userStats.pointsToNextLevel) * 100;
  }

  getQuizAccuracy(userStats: UserStats): number {
    if (userStats.totalQuizzesTaken === 0) return 0;
    return (userStats.totalQuizzesPassed / userStats.totalQuizzesTaken) * 100;
  }

  getUnlockedAchievements(userStats: UserStats): Achievement[] {
    return userStats.achievements?.filter((a) => a.unlocked) || [];
  }

  getLockedAchievements(userStats: UserStats): Achievement[] {
    return userStats.achievements?.filter((a) => !a.unlocked) || [];
  }

  getRecentStudySessions(
    userStats: UserStats,
    limit: number = 5
  ): StudySession[] {
    return (
      userStats.studySessions
        ?.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit) || []
    );
  }

  getStudyTimeFormatted(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  getLevelName(level: number): string {
    const levels = [
      { level: 1, name: 'Novice Learner', badge: '🌱' },
      { level: 2, name: 'Curious Explorer', badge: '📚' },
      { level: 3, name: 'Dedicated Student', badge: '🎓' },
      { level: 4, name: 'Knowledge Seeker', badge: '🔍' },
      { level: 5, name: 'Learning Enthusiast', badge: '⭐' },
      { level: 6, name: 'Academic Achiever', badge: '🏆' },
      { level: 7, name: 'Master Learner', badge: '👑' },
      { level: 8, name: 'Knowledge Master', badge: '🌟' },
    ];

    const levelData = levels.find((l) => l.level === level);
    return levelData
      ? `${levelData.badge} ${levelData.name}`
      : `Level ${level}`;
  }
}
