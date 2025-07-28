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

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userStatsId: number;

  @ManyToOne(() => UserStats, (userStats) => userStats.achievements, {
    cascade: false,
  })
  @JoinColumn({ name: 'userStatsId' })
  userStats: UserStats;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  icon: string;

  @Column()
  points: number;

  @Column({ default: false })
  unlocked: boolean;

  @Column({ type: 'datetime', nullable: true })
  unlockedAt: Date;

  @Column({ type: 'json', nullable: true })
  criteria: any; // Store achievement criteria

  @Column({ default: 0 })
  progress: number; // Progress towards unlocking (0-100)

  @Column({ default: 100 })
  maxProgress: number; // Required progress to unlock

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
