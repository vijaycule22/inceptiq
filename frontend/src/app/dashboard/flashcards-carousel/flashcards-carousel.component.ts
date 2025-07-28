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
  currentCardIndex = 0;
  private navigationTimer: any;
  private lastKnownIndex = 0;
  private studyTimer: Subscription | null = null;
  private studyStartTime: number = 0;
  private reviewedCards: Set<number> = new Set();

  constructor(private gamificationService: GamificationService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['flashcards']) {
      this.resetFlippedCards();
      this.lastKnownIndex = 0;
      this.currentCardIndex = 0;
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
          this.flippedCards = {};
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

  resetFlippedCards() {
    this.flippedCards = {};
  }

  onCarouselChange(event: any) {
    this.currentCardIndex = event.index;
    this.lastKnownIndex = event.index;
    this.flippedCards = {};
  }

  goToNext() {
    if (this.carousel && this.currentCardIndex < this.flashcards.length - 1) {
      this.flippedCards = {};
      this.currentCardIndex++;
      this.lastKnownIndex = this.currentCardIndex;
      this.carousel.page = this.currentCardIndex;
    }
  }

  goToPrevious() {
    if (this.carousel && this.currentCardIndex > 0) {
      this.flippedCards = {};
      this.currentCardIndex--;
      this.lastKnownIndex = this.currentCardIndex;
      this.carousel.page = this.currentCardIndex;
    }
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
    // The gamification service now handles recording sessions to the backend
    // No need to call dashboard service separately
    console.log(
      'Flashcard session completed:',
      this.flashcards.length,
      'cards reviewed'
    );
  }
}
