import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GamificationService,
  UserStats,
  Level,
} from '../../services/gamification.service';

@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-indicator.component.html',
  styleUrls: ['./progress-indicator.component.css'],
})
export class ProgressIndicatorComponent implements OnInit {
  userStats: UserStats | null = null;
  currentLevel: Level | undefined;

  constructor(private gamificationService: GamificationService) {}

  ngOnInit() {
    console.log('Progress indicator initializing...');
    this.gamificationService.userStats$.subscribe((stats) => {
      console.log('Progress indicator received stats:', stats);
      this.userStats = stats;
      this.currentLevel = this.gamificationService
        .getLevels()
        .find((l) => l.level === stats.level);
      console.log('Current level:', this.currentLevel);
    });
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

  getNextLevelName(): string {
    if (!this.userStats) return '';

    const levels = this.gamificationService.getLevels();
    const nextLevel = levels.find((l) => l.level === this.userStats!.level + 1);

    return nextLevel ? nextLevel.name : '';
  }
}
