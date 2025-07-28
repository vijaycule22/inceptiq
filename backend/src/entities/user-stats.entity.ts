import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Achievement } from './achievement.entity';
import { StudySession } from './study-session.entity';

@Entity('user_stats')
export class UserStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.userStats)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 0 })
  currentLevelPoints: number;

  @Column({ default: 100 })
  pointsToNextLevel: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ default: 0 })
  totalStudyTime: number; // in minutes

  @Column({ default: 0 })
  totalTopics: number;

  @Column({ default: 0 })
  totalQuizzesTaken: number;

  @Column({ default: 0 })
  totalQuizzesPassed: number;

  @Column({ default: 0 })
  totalFlashcardsReviewed: number;

  @Column({ type: 'datetime', nullable: true })
  lastStudyDate: Date;

  @Column({ type: 'json', nullable: true })
  weeklyProgress: any; // Store weekly progress data

  @Column({ type: 'json', nullable: true })
  monthlyProgress: any; // Store monthly progress data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Achievement, (achievement) => achievement.userStats, {
    cascade: false,
    eager: false,
  })
  achievements: Achievement[];

  @OneToMany(() => StudySession, (studySession) => studySession.userStats, {
    cascade: false,
    eager: false,
  })
  studySessions: StudySession[];
}
