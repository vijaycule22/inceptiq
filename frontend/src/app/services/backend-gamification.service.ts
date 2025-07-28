import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface BackendUserStats {
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
  lastStudyDate?: Date;
  weeklyProgress?: any;
  monthlyProgress?: any;
  createdAt: Date;
  updatedAt: Date;
  achievements: BackendAchievement[];
}

export interface BackendAchievement {
  id: number;
  userStatsId: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  criteria?: any;
  progress: number;
  maxProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySessionData {
  sessionType: string;
  topicName?: string;
  duration?: number;
  pointsEarned?: number;
  sessionData?: any;
}

@Injectable({
  providedIn: 'root',
})
export class BackendGamificationService {
  private baseUrl = 'http://localhost:3000/dashboard';
  private userStatsSubject = new BehaviorSubject<BackendUserStats | null>(null);
  public userStats$ = this.userStatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get user stats from backend
  getUserStats(): Observable<BackendUserStats> {
    console.log('Making request to:', `${this.baseUrl}/stats`);
    return this.http.get<BackendUserStats>(`${this.baseUrl}/stats`).pipe(
      tap((stats) => {
        console.log('Received stats from backend:', stats);
        this.userStatsSubject.next(stats);
      })
    );
  }

  // Record a study session
  recordStudySession(sessionData: StudySessionData): Observable<any> {
    return this.http.post(`${this.baseUrl}/session`, sessionData).pipe(
      tap(() => {
        // Refresh user stats after recording session
        this.getUserStats().subscribe();
      })
    );
  }

  // Add points
  addPoints(points: number, reason: string): Observable<BackendUserStats> {
    return this.http
      .post<BackendUserStats>(`${this.baseUrl}/points`, {
        points,
        reason,
      })
      .pipe(
        tap((stats) => {
          this.userStatsSubject.next(stats);
        })
      );
  }

  // Update user stats
  updateUserStats(
    updates: Partial<BackendUserStats>
  ): Observable<BackendUserStats> {
    return this.http
      .put<BackendUserStats>(`${this.baseUrl}/stats`, updates)
      .pipe(
        tap((stats) => {
          this.userStatsSubject.next(stats);
        })
      );
  }

  // Get current user stats from cache
  getCurrentStats(): BackendUserStats | null {
    return this.userStatsSubject.value;
  }

  // Initialize user stats (load from backend)
  initializeStats(): Observable<BackendUserStats> {
    return this.getUserStats();
  }
}
