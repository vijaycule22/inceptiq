import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { GamificationService } from '../../services/gamification.service';

@Component({
  selector: 'app-quiz-panel',
  standalone: true,
  imports: [
    CommonModule,
    RadioButtonModule,
    ButtonModule,
    FormsModule,
    CardModule,
  ],
  templateUrl: './quiz-panel.component.html',
  styleUrl: './quiz-panel.component.css',
})
export class QuizPanelComponent {
  @Input() quiz: any[] = [];
  @Input() topicName: string = '';

  currentQuestionIndex = 0;
  userAnswers: { [key: number]: string } = {};
  quizCompleted = false;
  score = 0;
  totalQuestions = 0;
  showReview = false;

  constructor(private gamificationService: GamificationService) {}

  ngOnInit() {
    this.totalQuestions = this.quiz.length;
  }

  selectAnswer(questionIndex: number, answer: string) {
    this.userAnswers[questionIndex] = answer;
  }

  isAnswerSelected(questionIndex: number, answer: string): boolean {
    return this.userAnswers[questionIndex] === answer;
  }

  isCorrectAnswer(question: any, answer: string): boolean {
    return question.answer === answer;
  }

  goToNextQuestion() {
    if (this.currentQuestionIndex < this.totalQuestions - 1) {
      this.currentQuestionIndex++;
    }
  }

  goToPreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentQuestionIndex = index;
    }
  }

  isQuestionAnswered(index: number): boolean {
    return this.userAnswers[index] !== undefined;
  }

  getCurrentQuestion() {
    return this.quiz[this.currentQuestionIndex];
  }

  getParsedOptions(question: any): string[] {
    if (question.options && Array.isArray(question.options)) {
      return question.options;
    }
    return [];
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  submitQuiz() {
    this.score = 0;
    this.quiz.forEach((question, index) => {
      if (this.userAnswers[index] === question.answer) {
        this.score++;
      }
    });

    const scorePercentage = (this.score / this.totalQuestions) * 100;

    // Add gamification points for completing quiz
    this.gamificationService.addPoints(50, 'Quiz completed');
    this.gamificationService.addQuizCompletion(scorePercentage);
    this.gamificationService.updateStreak();

    this.quizCompleted = true;
  }

  resetQuiz() {
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.quizCompleted = false;
    this.score = 0;
    this.showReview = false;
  }

  toggleReview() {
    this.showReview = !this.showReview;
  }

  getScorePercentage(): number {
    return this.totalQuestions > 0
      ? Math.round((this.score / this.totalQuestions) * 100)
      : 0;
  }

  getScoreMessage(): string {
    const percentage = this.getScorePercentage();
    if (percentage >= 90) return 'Excellent! 🎉';
    if (percentage >= 80) return 'Great job! 👍';
    if (percentage >= 70) return 'Good work! 😊';
    if (percentage >= 60) return 'Not bad! 📚';
    return 'Keep studying! 💪';
  }

  areAllQuestionsAnswered(): boolean {
    return Object.keys(this.userAnswers).length >= this.totalQuestions;
  }

  getAnsweredCount(): number {
    return Object.keys(this.userAnswers).length;
  }

  getProgressPercentage(): number {
    return (this.getAnsweredCount() / this.totalQuestions) * 100;
  }

  // Header method
  getPerformanceLevel(): string {
    if (this.quizCompleted) {
      const percentage = this.getScorePercentage();
      if (percentage >= 90) return 'Expert';
      if (percentage >= 80) return 'Advanced';
      if (percentage >= 70) return 'Intermediate';
      if (percentage >= 60) return 'Beginner';
      return 'Novice';
    }

    // If quiz not completed, base on answered questions
    const answeredPercentage =
      (this.getAnsweredCount() / this.totalQuestions) * 100;
    if (answeredPercentage >= 80) return 'Active';
    if (answeredPercentage >= 60) return 'Engaged';
    if (answeredPercentage >= 40) return 'Progressing';
    if (answeredPercentage >= 20) return 'Starting';
    return 'New';
  }
}
