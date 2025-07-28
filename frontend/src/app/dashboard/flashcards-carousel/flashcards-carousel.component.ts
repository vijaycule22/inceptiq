import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { GamificationService } from '../../services/gamification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-flashcards-carousel',
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: './flashcards-carousel.component.html',
  styleUrl: './flashcards-carousel.component.css',
})
export class FlashcardsCarouselComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() flashcards: any[] = [];
  @ViewChild('carousel') carousel: any;

  flippedCards: { [key: number]: boolean } = {};
  rememberedCards: { [key: number]: boolean } = {};
  currentCardIndex = 0;
  private navigationTimer: any;
  private lastKnownIndex = 0;
  private studyTimer: Subscription | null = null;
  private studyStartTime: number = 0;
  private reviewedCards: Set<number> = new Set();
  private rememberedCount = 0;

  constructor(private gamificationService: GamificationService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['flashcards']) {
      this.resetFlippedCards();
      this.resetRememberedCards();
      this.lastKnownIndex = 0;
      this.currentCardIndex = 0;
      this.reviewedCards.clear();
      this.rememberedCount = 0;
    }
  }

  ngAfterViewInit() {
    this.setupNavigationDetection();
    this.startStudyTimer();
  }

  ngOnDestroy() {
    if (this.navigationTimer) {
      clearInterval(this.navigationTimer);
    }
    this.stopStudyTimer();
    // If all cards were reviewed, ensure session is recorded
    if (
      this.reviewedCards.size === this.flashcards.length &&
      this.flashcards.length > 0
    ) {
      this.recordFlashcardSession();
    }
  }

  setupNavigationDetection() {
    this.navigationTimer = setInterval(() => {
      if (this.carousel) {
        const currentPage = this.carousel.page || 0;

        if (currentPage !== this.lastKnownIndex) {
          this.lastKnownIndex = currentPage;
          this.currentCardIndex = currentPage;
          this.flippedCards = {}; // Only reset flipped state, keep remembered state
        }
      }
    }, 50);
  }

  flipCard(index: number) {
    this.flippedCards[index] = !this.flippedCards[index];
    this.reviewedCards.add(index);

    // If all cards reviewed, record session
    if (
      this.reviewedCards.size === this.flashcards.length &&
      this.flashcards.length > 0
    ) {
      this.recordFlashcardSession();
    }
  }

  isFlipped(index: number): boolean {
    return this.flippedCards[index] === true;
  }

  markAsRemembered(index: number) {
    if (!this.rememberedCards[index]) {
      this.rememberedCards[index] = true;
      this.rememberedCount++;

      // Add gamification points for remembering a card
      this.gamificationService.addFlashcardRemembered();

      // Check if this is a milestone (every 5 cards remembered)
      if (this.rememberedCount % 5 === 0) {
        this.gamificationService.addPoints(
          25,
          `Remembered ${this.rememberedCount} flashcards`
        );
      }
    }
  }

  markAsForgotten(index: number) {
    if (this.rememberedCards[index]) {
      this.rememberedCards[index] = false;
      this.rememberedCount--;
    }
  }

  isRemembered(index: number): boolean {
    return this.rememberedCards[index] === true;
  }

  isCurrentCardRemembered(): boolean {
    return this.isRemembered(this.currentCardIndex);
  }

  getCurrentCardRememberedStatus(): string {
    return this.isCurrentCardRemembered() ? 'Remembered' : 'Not Remembered';
  }

  resetFlippedCards() {
    this.flippedCards = {};
  }

  resetRememberedCards() {
    this.rememberedCards = {};
    this.rememberedCount = 0;
  }

  onCarouselChange(event: any) {
    this.currentCardIndex = event.index;
    this.lastKnownIndex = event.index;
    this.flippedCards = {}; // Only reset flipped state, keep remembered state
  }

  goToNext() {
    if (this.carousel && this.currentCardIndex < this.flashcards.length - 1) {
      this.flippedCards = {};
      this.currentCardIndex++;
      this.lastKnownIndex = this.currentCardIndex;
      this.carousel.page = this.currentCardIndex;
      // Don't reset remembered cards when navigating - they should persist
    }
  }

  goToPrevious() {
    if (this.carousel && this.currentCardIndex > 0) {
      this.flippedCards = {};
      this.currentCardIndex--;
      this.lastKnownIndex = this.currentCardIndex;
      this.carousel.page = this.currentCardIndex;
      // Don't reset remembered cards when navigating - they should persist
    }
  }

  // Header methods
  getStudiedCardsCount(): number {
    return this.reviewedCards.size;
  }

  getRememberedCardsCount(): number {
    return this.rememberedCount;
  }

  getMasteryLevel(): string {
    if (this.flashcards.length === 0) return 'Beginner';

    const studiedPercentage =
      (this.reviewedCards.size / this.flashcards.length) * 100;
    const rememberedPercentage =
      (this.rememberedCount / this.flashcards.length) * 100;

    // Consider both studied and remembered cards for mastery level
    if (rememberedPercentage >= 80) return 'Expert';
    if (rememberedPercentage >= 60) return 'Advanced';
    if (studiedPercentage >= 80) return 'Intermediate';
    if (studiedPercentage >= 40) return 'Beginner';
    return 'New';
  }

  private startStudyTimer() {
    this.studyStartTime = Date.now();
    // Track study time every minute
    this.studyTimer = interval(60000).subscribe(() => {
      const studyMinutes = Math.floor(
        (Date.now() - this.studyStartTime) / 60000
      );
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
      if (studyMinutes > 0) {
        this.gamificationService.addStudyTime(studyMinutes);
      }
    }
  }

  private recordFlashcardSession() {
    // Record flashcard session with remembered cards data
    const sessionData = {
      totalCards: this.flashcards.length,
      reviewedCards: this.reviewedCards.size,
      rememberedCards: this.rememberedCount,
      studyTime: Math.floor((Date.now() - this.studyStartTime) / 60000),
    };

    console.log('Flashcard session completed:', sessionData);

    // Add bonus points for high retention rate
    const retentionRate = (this.rememberedCount / this.flashcards.length) * 100;
    if (retentionRate >= 80) {
      this.gamificationService.addPoints(50, 'High retention rate');
    } else if (retentionRate >= 60) {
      this.gamificationService.addPoints(25, 'Good retention rate');
    }
  }
}
