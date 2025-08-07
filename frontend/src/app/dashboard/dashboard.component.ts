import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SummaryCardComponent } from './summary-card/summary-card.component';
import { FlashcardsCarouselComponent } from './flashcards-carousel/flashcards-carousel.component';
import { QuizPanelComponent } from './quiz-panel/quiz-panel.component';
import { TopicService, Topic } from '../services/topic.service';
import { Subscription } from 'rxjs';
import { GamificationService } from '../services/gamification.service';
import { CreditService } from '../services/credit.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SummaryCardComponent,
    FlashcardsCarouselComponent,
    QuizPanelComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() panel: 'summary' | 'flashcards' | 'quiz' | 'dashboard' | 'progress' =
    'summary';
  @Input() topic: string = '';
  @Input() topics: Topic[] = [];
  @Input() showUploadForm: boolean = false;
  @Input() showWelcomeForm: boolean = false;
  @Output() uploadNewTopic = new EventEmitter<void>();
  @Output() startLearning = new EventEmitter<void>();
  @Output() cancelUploadForm = new EventEmitter<void>();
  @Output() selectPanel = new EventEmitter<{
    type: 'summary' | 'flashcards' | 'quiz' | 'dashboard';
    topic: string;
  }>();

  currentTopic: Topic | undefined;
  topicName = '';
  file: File | null = null;
  filePreview: string | null = null;
  fileName = '';
  isImage = false;
  isPdf = false;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  isDragOver = false;

  // Generation options
  generateSummary = true;
  generateFlashcards = true;
  generateQuiz = true;

  // Credit tracking
  creditBalance = 0;

  private subscription: Subscription = new Subscription();

  constructor(
    private topicService: TopicService,
    private gamificationService: GamificationService,
    private creditService: CreditService
  ) {}

  ngOnInit() {
    // Update current topic when topics input changes
    if (this.topic && this.topics.length > 0) {
      this.currentTopic = this.topics.find((t) => t.name === this.topic);
      console.log('Current topic:', this.currentTopic);
      console.log('Flashcards:', this.flashcards);
      console.log('Quizzes:', this.quiz);
    }

    // Load credit balance
    this.loadCreditBalance();
  }

  loadCreditBalance() {
    this.creditService.getCreditBalance().subscribe({
      next: (balance) => {
        this.creditBalance = balance.balance;
      },
      error: (err) => {
        console.error('Error loading credit balance:', err);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(
      'Dashboard ngOnChanges - topic:',
      this.topic,
      'showUploadForm:',
      this.showUploadForm,
      'topics length:',
      this.topics.length
    );

    // Handle showUploadForm input changes
    if (changes['showUploadForm']) {
      console.log('showUploadForm changed to:', this.showUploadForm);
    }

    // Handle topics input changes
    if (changes['topics'] && this.topics.length > 0) {
      console.log('Topics updated:', this.topics.length, 'topics');
    }

    // Handle topic input changes
    if (changes['topic'] && this.topic && this.topics.length > 0) {
      this.currentTopic = this.topics.find((t) => t.name === this.topic);
      console.log('Topic selected:', this.topic);
    }

    // Check if we should show upload form (when topic is empty)
    if (changes['topic'] && !this.topic) {
      console.log('No topic selected');
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get summary() {
    return this.currentTopic?.summary || 'No summary available.';
  }

  get flashcards() {
    return this.currentTopic?.flashcards || [];
  }

  get quiz() {
    return this.currentTopic?.quiz || [];
  }

  get hasTopic() {
    // If we want to show upload form, don't show topic content
    if (this.showUploadForm) {
      return false;
    }
    // Check if there are any topics in the topics array
    return this.topics && this.topics.length > 0;
  }

  onUploadNewTopic() {
    console.log('Dashboard onUploadNewTopic called');
    this.uploadNewTopic.emit();
  }

  onStartLearning() {
    this.startLearning.emit();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];
    if (!allowedTypes.includes(file.type)) {
      this.error = 'Please upload a PDF or image file (PNG, JPG, JPEG, GIF).';
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.error = 'File size must be less than 10MB.';
      return;
    }

    this.file = file;
    this.fileName = file.name;
    this.error = null;

    const fileType = file.type;
    this.isImage = fileType.startsWith('image/');
    this.isPdf = fileType === 'application/pdf';

    // Generate topic name from file name
    this.generateTopicNameFromFile(file);

    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.filePreview = null;
    }
  }

  private generateTopicNameFromFile(file: File) {
    // Remove file extension and clean up the name
    let name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

    // Replace underscores and dashes with spaces
    name = name.replace(/[_-]/g, ' ');

    // Capitalize first letter of each word
    name = name.replace(/\b\w/g, (l) => l.toUpperCase());

    // Limit length
    if (name.length > 50) {
      name = name.substring(0, 50) + '...';
    }

    this.topicName = name;
  }

  uploadAndGenerate() {
    if (!this.topicName.trim() || !this.file) return;

    // Check credit balance before upload
    const requiredCredits = this.getTotalCreditsRequired();
    if (requiredCredits > 0) {
      this.creditService.getCreditBalance().subscribe({
        next: (balance) => {
          if (balance.balance < requiredCredits) {
            this.error = `Insufficient credits. You have ${balance.balance} credits but need ${requiredCredits} credits for the selected options. Please purchase more credits.`;
            return;
          }
          this.performUpload();
        },
        error: (err) => {
          console.error('Error checking credit balance:', err);
          this.error = 'Unable to check credit balance. Please try again.';
        },
      });
    } else {
      this.performUpload();
    }
  }

  private performUpload() {
    this.loading = true;
    this.error = null;
    this.success = null;

    // Create form data with generation options
    const formData = new FormData();
    if (this.file) {
      formData.append('file', this.file);
    }
    formData.append('topicName', this.topicName);
    formData.append('generateSummary', this.generateSummary.toString());
    formData.append('generateFlashcards', this.generateFlashcards.toString());
    formData.append('generateQuiz', this.generateQuiz.toString());

    this.topicService.uploadTopicWithOptions(formData).subscribe({
      next: (newTopic) => {
        this.topicService.addTopic(newTopic);

        // Add gamification points for uploading a topic
        this.gamificationService.addPoints(25, 'Topic uploaded');
        this.gamificationService.addTopic();
        this.gamificationService.updateStreak();

        // Refresh credit balance after successful upload
        this.creditService.loadCreditBalance();

        this.loading = false;
        this.success = 'Topic created successfully!';

        // Clear the form
        this.topicName = '';
        this.file = null;
        this.filePreview = null;
        this.fileName = '';
        this.showUploadForm = false;

        // Navigate to the newly created topic's summary
        setTimeout(() => {
          this.selectPanel.emit({
            type: 'summary',
            topic: newTopic.name,
          });
          this.success = null;
        }, 1000);
      },
      error: (err) => {
        console.error('Upload error:', err);

        // Handle credit-related errors
        if (err.error && err.error.includes('Insufficient credits')) {
          this.error = err.error;
        } else if (err.error && err.error.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to process file. Please try again.';
        }

        this.loading = false;
      },
    });
  }

  cancelUpload() {
    this.cancelUploadForm.emit();
  }

  getTotalCreditsRequired(): number {
    let total = 0;
    if (this.generateSummary) total += 1; // SUMMARY_GENERATION costs 1 credit
    if (this.generateFlashcards) total += 1;
    if (this.generateQuiz) total += 1;
    return total;
  }

  hasInsufficientCredits(): boolean {
    const requiredCredits = this.getTotalCreditsRequired();
    return this.creditBalance < requiredCredits;
  }

  getUploadButtonText(): string {
    if (this.loading) return 'Processing...';
    if (this.hasInsufficientCredits()) return 'Insufficient Credits';
    return 'Upload & Generate';
  }
}
