import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import { GamificationService } from '../../services/gamification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.css',
})
export class SummaryCardComponent implements OnInit, OnDestroy {
  @Input() summary: string = '';
  @Input() topicName: string = '';
  renderedSummary: string = '';
  private studyTimer: Subscription | null = null;
  private studyStartTime: number = 0;
  private studyMinutes: number = 0;

  constructor(private gamificationService: GamificationService) {}

  ngOnInit() {
    this.renderMarkdown();
    this.startStudyTimer();
  }

  ngOnDestroy() {
    this.stopStudyTimer();
  }

  ngOnChanges() {
    this.renderMarkdown();
  }

  private startStudyTimer() {
    this.studyStartTime = Date.now();
    // Track study time every minute
    this.studyTimer = interval(60000).subscribe(() => {
      const studyMinutes = Math.floor(
        (Date.now() - this.studyStartTime) / 60000
      );
      this.studyMinutes = studyMinutes;
      if (studyMinutes > 0) {
        this.gamificationService.addStudyTime(studyMinutes);
        this.gamificationService.updateStreak();
      }
    });
  }

  private stopStudyTimer() {
    if (this.studyTimer) {
      this.studyTimer.unsubscribe();
      this.studyTimer = null;

      // Add final study time when component is destroyed
      const studyMinutes = Math.floor(
        (Date.now() - this.studyStartTime) / 60000
      );
      this.studyMinutes = studyMinutes;
      if (studyMinutes > 0) {
        this.gamificationService.addStudyTime(studyMinutes);
      }
    }
  }

  private async renderMarkdown() {
    if (this.summary) {
      try {
        this.renderedSummary = await marked(this.summary);
      } catch (error) {
        console.error('Error rendering markdown:', error);
        this.renderedSummary = this.summary;
      }
    } else {
      this.renderedSummary = '';
    }
  }

  // Header methods
  getStudyTime(): string {
    const totalMinutes = Math.floor((Date.now() - this.studyStartTime) / 60000);
    if (totalMinutes < 1) return '0m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  getKeyPointsCount(): number {
    if (!this.summary) return 0;
    // Count bullet points and numbered lists
    const bulletPoints = (this.summary.match(/^[\s]*[-*•]\s/gm) || []).length;
    const numberedPoints = (this.summary.match(/^[\s]*\d+\.\s/gm) || []).length;
    const totalPoints = bulletPoints + numberedPoints;
    return totalPoints > 0 ? totalPoints : Math.ceil(this.summary.length / 200);
  }

  getReadingTime(): number {
    if (!this.summary) return 0;
    // Average reading speed: 200-250 words per minute
    const wordCount = this.summary.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 225);
    return Math.max(1, readingTimeMinutes);
  }

  getComprehensionLevel(): string {
    if (!this.summary) return 'Beginner';

    const wordCount = this.summary.split(/\s+/).length;
    const keyPoints = this.getKeyPointsCount();

    if (wordCount > 1000 && keyPoints > 10) return 'Advanced';
    if (wordCount > 500 && keyPoints > 5) return 'Intermediate';
    return 'Beginner';
  }
}
