import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

export interface LeaderboardUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  totalTopics: number;
  totalStudyTime: number;
  rank: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './leaderboard.component.html',
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  leaderboardUsers: LeaderboardUser[] = [];
  currentUser: any = null;
  loading = true;
  error: string | null = null;
  private subscription = new Subscription();

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadLeaderboard();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  reloadLeaderboard() {
    this.loadLeaderboard();
  }

  // Method to check if component should be visible
  isVisible(): boolean {
    return this.leaderboardUsers.length > 0 || this.loading || !!this.error;
  }

  loadLeaderboard() {
    this.loading = true;
    this.error = null;

    this.subscription.add(
      this.http
        .get<LeaderboardUser[]>('http://localhost:3000/dashboard/leaderboard')
        .subscribe({
          next: (users) => {
            this.leaderboardUsers = users.map((user, index) => ({
              ...user,
              rank: index + 1,
            }));
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load leaderboard data';
            this.loading = false;

            // Fallback to mock data for development
            this.loadMockLeaderboard();
          },
        })
    );
  }

  loadMockLeaderboard() {
    this.leaderboardUsers = [
      {
        id: 1,
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex@example.com',
        totalPoints: 1250,
        level: 5,
        currentStreak: 12,
        totalTopics: 8,
        totalStudyTime: 480,
        rank: 1,
      },
      {
        id: 2,
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah@example.com',
        totalPoints: 980,
        level: 4,
        currentStreak: 8,
        totalTopics: 6,
        totalStudyTime: 360,
        rank: 2,
      },
      {
        id: 3,
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike@example.com',
        totalPoints: 750,
        level: 3,
        currentStreak: 5,
        totalTopics: 4,
        totalStudyTime: 240,
        rank: 3,
      },
      {
        id: 4,
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma@example.com',
        totalPoints: 520,
        level: 2,
        currentStreak: 3,
        totalTopics: 3,
        totalStudyTime: 180,
        rank: 4,
      },
      {
        id: 5,
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        totalPoints: 320,
        level: 2,
        currentStreak: 2,
        totalTopics: 2,
        totalStudyTime: 120,
        rank: 5,
      },
    ];
    console.log('Mock leaderboard data loaded:', this.leaderboardUsers);
    this.loading = false;
  }

  getCurrentUserRank(): number {
    if (!this.currentUser) return 0;
    const user = this.leaderboardUsers.find(
      (u) => u.id === this.currentUser.id
    );
    return user ? user.rank : 0;
  }

  isCurrentUser(user: LeaderboardUser): boolean {
    return this.currentUser && user.id === this.currentUser.id;
  }

  getRankBadge(rank: number): string {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  }

  getRankColor(rank: number): string {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-100';
      case 2:
        return 'text-gray-600 bg-gray-100';
      case 3:
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  }

  formatStudyTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getLevelBadge(level: number): string {
    const badges = ['🌱', '🔍', '📚', '⭐', '🏆', '👑'];
    return badges[Math.min(level - 1, badges.length - 1)] || '🌱';
  }

  getLongestStreakUser(): LeaderboardUser | null {
    if (this.leaderboardUsers.length === 0) return null;
    return this.leaderboardUsers.reduce((max, user) =>
      user.currentStreak > max.currentStreak ? user : max
    );
  }

  getMostStudyTimeUser(): LeaderboardUser | null {
    if (this.leaderboardUsers.length === 0) return null;
    return this.leaderboardUsers.reduce((max, user) =>
      user.totalStudyTime > max.totalStudyTime ? user : max
    );
  }
}
