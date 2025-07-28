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
}
