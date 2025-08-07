import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Topic } from './topic.entity';
import { PasswordReset } from './password-reset.entity';
import { UserStats } from './user-stats.entity';
import { CreditTransaction } from './credit-transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  creditBalance: number;

  @Column({ default: 0 })
  totalCreditsEarned: number;

  @Column({ default: 0 })
  totalCreditsSpent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Topic, (topic) => topic.user)
  topics: Topic[];

  @OneToMany(() => PasswordReset, (passwordReset) => passwordReset.user)
  passwordResets: PasswordReset[];

  @OneToOne(() => UserStats, (userStats) => userStats.user)
  userStats: UserStats;

  @OneToMany(() => CreditTransaction, (transaction) => transaction.user)
  creditTransactions: CreditTransaction[];
}
