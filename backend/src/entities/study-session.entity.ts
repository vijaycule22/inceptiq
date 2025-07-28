import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserStats } from './user-stats.entity';

@Entity('study_sessions')
export class StudySession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userStatsId: number;

  @ManyToOne(() => UserStats, (userStats) => userStats.studySessions, {
    cascade: false,
  })
  @JoinColumn({ name: 'userStatsId' })
  userStats: UserStats;

  @Column()
  sessionType: string; // 'summary', 'flashcards', 'quiz', 'upload'

  @Column({ nullable: true })
  topicName: string;

  @Column({ default: 0 })
  duration: number; // in minutes

  @Column({ default: 0 })
  pointsEarned: number;

  @Column({ type: 'json', nullable: true })
  sessionData: any; // Store session-specific data

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
