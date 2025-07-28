import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TopicService, Topic } from '../../services/topic.service';
import {
  GamificationService,
  UserStats,
} from '../../services/gamification.service';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, AccordionModule, ButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
  topics: Topic[] = [];
  currentUser: User | null = null;
  userStats: UserStats | null = null;
  private subscription: Subscription = new Subscription();

  @Input() selectedTopic: string = '';
  @Input() selectedPanel:
    | 'summary'
    | 'flashcards'
    | 'quiz'
    | 'dashboard'
    | 'leaderboard' = 'summary';

  @Output() selectPanel = new EventEmitter<{
    type: 'summary' | 'flashcards' | 'quiz' | 'dashboard' | 'leaderboard';
    topic: string;
  }>();
  @Output() uploadNewTopic = new EventEmitter<void>();

  constructor(
    private topicService: TopicService,
    private gamificationService: GamificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;

    // Subscribe to topics
    this.subscription.add(
      this.topicService.topics$.subscribe((topics) => {
        this.topics = topics;
      })
    );

    // Subscribe to user stats
    this.subscription.add(
      this.gamificationService.userStats$.subscribe((stats) => {
        this.userStats = stats;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSelect(
    type: 'summary' | 'flashcards' | 'quiz' | 'dashboard' | 'leaderboard',
    topic: string
  ) {
    this.selectPanel.emit({ type, topic });
  }

  onUploadNewTopic() {
    this.uploadNewTopic.emit();
  }

  getActiveIndex(): number | number[] {
    // If we're on dashboard or leaderboard, don't expand any accordion
    if (
      this.selectedPanel === 'dashboard' ||
      this.selectedPanel === 'leaderboard'
    )
      return [];

    // If we have a selected topic, expand that accordion
    if (this.selectedTopic) {
      const idx = this.topics.findIndex((t) => t.name === this.selectedTopic);
      return idx >= 0 ? [idx] : [];
    }

    return [];
  }

  isActiveMenu(
    type: 'summary' | 'flashcards' | 'quiz' | 'dashboard' | 'leaderboard',
    topic: string
  ): boolean {
    return this.selectedTopic === topic && this.selectedPanel === type;
  }

  isAccordionOpen(index: number): boolean {
    const activeIndex = this.getActiveIndex();
    if (Array.isArray(activeIndex)) {
      return activeIndex.includes(index);
    }
    return activeIndex === index;
  }

  // Quick Actions Methods
  isDashboardActive(): boolean {
    return this.selectedPanel === 'dashboard';
  }

  isLeaderboardActive(): boolean {
    return this.selectedPanel === 'leaderboard';
  }

  onDashboard() {
    // Emit event to parent component to show dashboard
    this.selectPanel.emit({ type: 'dashboard', topic: '' });
  }

  onLeaderboard() {
    // Emit event to parent component to show leaderboard
    this.selectPanel.emit({ type: 'leaderboard', topic: '' });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Progress Methods
  getCurrentLevel() {
    if (!this.userStats) return null;
    const levels = this.gamificationService.getLevels();
    return levels.find((l) => l.level === this.userStats!.level);
  }

  getProgressPercentage(): number {
    if (!this.userStats) return 0;

    const levels = this.gamificationService.getLevels();
    const currentLevel = levels.find((l) => l.level === this.userStats!.level);
    const nextLevel = levels.find((l) => l.level === this.userStats!.level + 1);

    if (!currentLevel || !nextLevel) return 100;

    const pointsInCurrentLevel =
      this.userStats.totalPoints - currentLevel.pointsRequired;
    const pointsNeededForNextLevel =
      nextLevel.pointsRequired - currentLevel.pointsRequired;

    return Math.min(
      100,
      (pointsInCurrentLevel / pointsNeededForNextLevel) * 100
    );
  }

  getUnlockedAchievements() {
    if (!this.userStats || !this.userStats.achievements) return [];
    return this.userStats.achievements.filter((a) => a.unlocked);
  }
}
