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
  selectedDifficulty: 'all' | 'beginner' | 'intermediate' | 'advanced' = 'all';
  filteredQuiz: any[] = [];

  constructor(private gamificationService: GamificationService) {}

  ngOnInit() {
    this.filterQuizByDifficulty();
  }

  ngOnChanges() {
    this.filterQuizByDifficulty();
  }

  filterQuizByDifficulty() {
    if (this.selectedDifficulty === 'all') {
      this.filteredQuiz = this.quiz;
    } else {
      this.filteredQuiz = this.quiz.filter(
        (q) => q.difficulty === this.selectedDifficulty
      );
    }
    this.totalQuestions = this.filteredQuiz.length;
    this.resetQuiz();
  }

  onDifficultyChange() {
    this.filterQuizByDifficulty();
  }

  getDifficultyStats() {
    const beginnerCount = this.quiz.filter(
      (q) => q.difficulty === 'beginner'
    ).length;
    const intermediateCount = this.quiz.filter(
      (q) => q.difficulty === 'intermediate'
    ).length;
    const advancedCount = this.quiz.filter(
      (q) => q.difficulty === 'advanced'
    ).length;
    return { beginnerCount, intermediateCount, advancedCount };
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
    return this.filteredQuiz[this.currentQuestionIndex];
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
    this.filteredQuiz.forEach((question, index) => {
      if (this.userAnswers[index] === question.answer) {
        this.score++;
      }
    });

    const scorePercentage = (this.score / this.totalQuestions) * 100;
    const difficulty =
      this.selectedDifficulty === 'all' ? 'mixed' : this.selectedDifficulty;

    // Add gamification points for completing quiz with difficulty bonus
    const basePoints = 50;
    const difficultyBonus =
      this.selectedDifficulty === 'advanced'
        ? 25
        : this.selectedDifficulty === 'intermediate'
        ? 15
        : this.selectedDifficulty === 'beginner'
        ? 10
        : 15;

    this.gamificationService.addPoints(
      basePoints + difficultyBonus,
      `Quiz completed (${difficulty})`
    );
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
    const difficulty = this.selectedDifficulty;

    if (difficulty === 'advanced') {
      if (percentage >= 90) return 'Exceptional! 🏆';
      if (percentage >= 80) return 'Outstanding! 🌟';
      if (percentage >= 70) return 'Excellent! 💪';
      if (percentage >= 60) return 'Good work! 👍';
      return 'Keep practicing! 📚';
    } else if (difficulty === 'intermediate') {
      if (percentage >= 90) return 'Excellent! 🌟';
      if (percentage >= 80) return 'Great job! 👍';
      if (percentage >= 70) return 'Well done! 😊';
      if (percentage >= 60) return 'Good progress! 📖';
      return 'Keep learning! 💪';
    } else if (difficulty === 'beginner') {
      if (percentage >= 90) return 'Perfect! 🎉';
      if (percentage >= 80) return 'Great job! 👍';
      if (percentage >= 70) return 'Well done! 😊';
      if (percentage >= 60) return 'Good start! 📖';
      return 'Keep learning! 💪';
    } else {
      if (percentage >= 90) return 'Amazing! 🎯';
      if (percentage >= 80) return 'Fantastic! 🌟';
      if (percentage >= 70) return 'Very good! 👍';
      if (percentage >= 60) return 'Not bad! 📚';
      return 'Keep studying! 💪';
    }
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
      const difficulty = this.selectedDifficulty;

      if (difficulty === 'advanced') {
        if (percentage >= 90) return 'Expert';
        if (percentage >= 80) return 'Advanced';
        if (percentage >= 70) return 'Intermediate';
        if (percentage >= 60) return 'Beginner';
        return 'Novice';
      } else if (difficulty === 'intermediate') {
        if (percentage >= 90) return 'Proficient';
        if (percentage >= 80) return 'Competent';
        if (percentage >= 70) return 'Intermediate';
        if (percentage >= 60) return 'Learning';
        return 'Starting';
      } else if (difficulty === 'beginner') {
        if (percentage >= 90) return 'Master';
        if (percentage >= 80) return 'Proficient';
        if (percentage >= 70) return 'Competent';
        if (percentage >= 60) return 'Learning';
        return 'Starting';
      } else {
        if (percentage >= 90) return 'Expert';
        if (percentage >= 80) return 'Advanced';
        if (percentage >= 70) return 'Intermediate';
        if (percentage >= 60) return 'Beginner';
        return 'Novice';
      }
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

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return 'Mixed';
    }
  }

  getNoQuestionsMessage(): string {
    if (this.selectedDifficulty === 'all') {
      return 'No quiz questions available for this topic.';
    } else {
      return `No ${this.selectedDifficulty} level questions available for this topic.`;
    }
  }
}
