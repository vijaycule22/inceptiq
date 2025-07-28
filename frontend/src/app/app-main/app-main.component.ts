import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { TopbarComponent } from '../core/topbar/topbar.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AiChatFabComponent } from '../dashboard/ai-chat-fab/ai-chat-fab.component';
import { SummaryCardComponent } from '../dashboard/summary-card/summary-card.component';
import { FlashcardsCarouselComponent } from '../dashboard/flashcards-carousel/flashcards-carousel.component';
import { QuizPanelComponent } from '../dashboard/quiz-panel/quiz-panel.component';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import { TopicService, Topic } from '../services/topic.service';
import {
  GamificationService,
  UserStats,
} from '../services/gamification.service';
import { AuthService, User } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    TopbarComponent,
    DashboardComponent,
    AiChatFabComponent,
    SummaryCardComponent,
    FlashcardsCarouselComponent,
    QuizPanelComponent,
    LeaderboardComponent,
  ],
  templateUrl: './app-main.component.html',
  styleUrls: ['./app-main.component.css'],
})
export class AppMainComponent implements OnInit, OnDestroy {
  selectedTopic: string = '';
  selectedPanel:
    | 'summary'
    | 'flashcards'
    | 'quiz'
    | 'dashboard'
    | 'leaderboard' = 'summary';
  showUploadForm = false;
  showWelcomeForm = false;
  showDashboard = false;
  topics: Topic[] = [];
  currentUser: User | null = null;
  userStats: UserStats | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    private topicService: TopicService,
    private gamificationService: GamificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;

    // Check for query parameters
    this.route.queryParams.subscribe((params) => {
      if (params['upload'] === 'true') {
        this.showUploadForm = true;
        this.showWelcomeForm = false;
        this.showDashboard = false;
      } else if (params['welcome'] === 'true') {
        this.showWelcomeForm = true;
        this.showUploadForm = false;
        this.showDashboard = false;
      } else if (params['dashboard'] === 'true') {
        this.showDashboard = true;
        this.showUploadForm = false;
        this.showWelcomeForm = false;
        this.selectedPanel = 'dashboard';
      }
    });

    // Load user's topics
    this.topicService.loadTopics();

    // Subscribe to topics
    this.subscription.add(
      this.topicService.topics$.subscribe((topics) => {
        this.topics = topics;

        // Show welcome form for new users with no topics
        if (
          topics.length === 0 &&
          !this.showUploadForm &&
          !this.showWelcomeForm &&
          !this.showDashboard
        ) {
          this.showWelcomeForm = true;
          this.showUploadForm = false;
          this.showDashboard = false;
        }
        // If no topic is selected and we have topics, select the first one
        else if (
          !this.selectedTopic &&
          topics.length > 0 &&
          !this.showUploadForm &&
          !this.showWelcomeForm &&
          !this.showDashboard &&
          this.selectedPanel !== 'leaderboard'
        ) {
          this.selectedTopic = topics[0].name;
          this.selectedPanel = 'summary';
        }
      })
    );

    // Load user stats from gamification service
    this.subscription.add(
      this.gamificationService.userStats$.subscribe((stats: UserStats) => {
        console.log('App main received user stats:', stats);
        this.userStats = stats;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSelectPanel(event: {
    type: 'summary' | 'flashcards' | 'quiz' | 'dashboard' | 'leaderboard';
    topic: string;
  }) {
    if (event.type === 'dashboard') {
      this.onDashboard();
    } else if (event.type === 'leaderboard') {
      this.onLeaderboard();
    } else {
      this.selectedTopic = event.topic;
      this.selectedPanel = event.type;
      this.showUploadForm = false;
      this.showWelcomeForm = false;
      this.showDashboard = false;
    }
  }

  onUploadNewTopic() {
    this.showUploadForm = true;
    this.showWelcomeForm = false;
    this.showDashboard = false;
    this.selectedTopic = ''; // Clear selected topic
    this.selectedPanel = 'dashboard'; // Set to dashboard to avoid conflicts
  }

  onStartLearning() {
    this.showUploadForm = true;
    this.showWelcomeForm = false;
    this.showDashboard = false;
  }

  onCancelUpload() {
    this.showUploadForm = false;
    this.showWelcomeForm = false;
    this.showDashboard = false;
    // Re-select first topic if available
    if (this.topics.length > 0) {
      this.selectedTopic = this.topics[0].name;
      this.selectedPanel = 'summary';
    }
  }

  onUploadComplete() {
    this.showUploadForm = false;
    this.showWelcomeForm = false;
    this.showDashboard = true;
    this.selectedPanel = 'dashboard';
    // Refresh topics after upload
    this.topicService.loadTopics();
  }

  onDashboard() {
    this.showDashboard = true;
    this.showUploadForm = false;
    this.showWelcomeForm = false;
    this.selectedPanel = 'dashboard';
  }

  onLeaderboard() {
    this.showDashboard = false;
    this.showUploadForm = false;
    this.showWelcomeForm = false;
    this.selectedPanel = 'leaderboard';
    this.selectedTopic = ''; // Clear selected topic when showing leaderboard
  }

  // Progress functionality is now integrated into the dashboard

  // Dashboard Methods
  getCurrentLevel() {
    if (!this.userStats) return null;
    const levels = this.gamificationService.getLevels();
    return levels.find((l) => l.level === this.userStats!.level);
  }

  getNextLevel() {
    if (!this.userStats) return null;
    const levels = this.gamificationService.getLevels();
    return levels.find((l) => l.level === this.userStats!.level + 1);
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

  formatStudyTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  get hasTopics(): boolean {
    return this.topics.length > 0;
  }

  get recentTopics(): Topic[] {
    return this.topics.slice(0, 3); // Show last 3 topics
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Topic Panel Helper Methods
  getTopicSummary(topicName: string): any {
    // Find the topic and return its summary data
    const topic = this.topics.find((t) => t.name === topicName);
    return topic?.summary || 'Summary not available for this topic.';
  }

  getTopicFlashcards(topicName: string): any[] {
    // Find the topic and return its flashcards data
    const topic = this.topics.find((t) => t.name === topicName);
    return topic?.flashcards || [];
  }

  getTopicQuiz(topicName: string): any {
    // Find the topic and return its quiz data
    const topic = this.topics.find((t) => t.name === topicName);
    return topic?.quiz || [];
  }
}
