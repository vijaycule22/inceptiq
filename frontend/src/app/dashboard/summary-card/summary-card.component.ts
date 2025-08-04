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

  isRead = false;
  isFavorited = false;

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

  // Extract actual key points from summary
  getExtractedKeyPoints(): string[] {
    if (!this.summary) return [];

    const keyPoints: string[] = [];

    // Split summary into lines
    const lines = this.summary.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for bullet points
      if (trimmedLine.match(/^[-*•]\s/)) {
        const point = trimmedLine.replace(/^[-*•]\s/, '').trim();
        if (point) keyPoints.push(point);
      }

      // Check for numbered lists
      if (trimmedLine.match(/^\d+\.\s/)) {
        const point = trimmedLine.replace(/^\d+\.\s/, '').trim();
        if (point) keyPoints.push(point);
      }
    }

    // If no structured points found, extract sentences that might be key points
    if (keyPoints.length === 0) {
      const sentences = this.summary
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      keyPoints.push(...sentences.slice(0, 5).map((s) => s.trim()));
    }

    return keyPoints.slice(0, 10); // Limit to 10 key points
  }

  // Check if key points section should be shown
  shouldShowKeyPoints(): boolean {
    return this.getExtractedKeyPoints().length > 0;
  }

  // Reading progress calculation
  getReadingProgress(): number {
    if (!this.summary) return 0;
    // Simulate reading progress based on time spent
    const timeSpent = Math.floor((Date.now() - this.studyStartTime) / 60000);
    const estimatedTime = this.getReadingTime();
    const progress = Math.min((timeSpent / estimatedTime) * 100, 100);
    return Math.round(progress);
  }

  // Word count
  getWordCount(): number {
    if (!this.summary) return 0;
    return this.summary.split(/\s+/).length;
  }

  // Last updated timestamp
  getLastUpdated(): string {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Navigation methods
  scrollToSection(section: string): void {
    const element = document.getElementById(section + '-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToKeyPoints(): void {
    this.scrollToSection('keypoints');
  }

  // Copy functionality
  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.summary);
      this.showToast('Summary copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showToast('Failed to copy summary', 'error');
    }
  }

  copyKeyPoint(point: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard
      .writeText(point)
      .then(() => {
        this.showToast('Key point copied!', 'success');
      })
      .catch(() => {
        this.showToast('Failed to copy key point', 'error');
      });
  }

  // Interactive features
  toggleFullscreen(): void {
    const element = document.getElementById('summary-section');
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        element.requestFullscreen();
      }
    }
  }

  markAsRead(): void {
    if (this.isRead) return;
    this.isRead = true;
    this.gamificationService.addPoints(20, 'Summary completed');
    this.showToast('Marked as read! +20 points', 'success');
  }

  addToFavorites(): void {
    if (this.isFavorited) return;
    this.isFavorited = true;
    this.gamificationService.addPoints(10, 'Added to favorites');
    this.showToast('Added to favorites! +10 points', 'success');
  }

  toggleKeyPoint(index: number): void {
    // Add gamification points for reviewing key points
    this.gamificationService.addPoints(5, 'Key point reviewed');
    this.showToast(`Key point ${index + 1} reviewed! +5 points`, 'success');
  }

  // Toast notification system
  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[1000] px-6 py-3 rounded-lg text-white font-medium shadow-lg transform translate-x-full transition-transform duration-300`;

    // Set color based on type
    if (type === 'success') {
      toast.className += ' bg-green-500';
    } else if (type === 'error') {
      toast.className += ' bg-red-500';
    } else {
      toast.className += ' bg-blue-500';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}
