import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TransactionType {
  PURCHASE = 'purchase',
  CONSUMPTION = 'consumption',
  BONUS = 'bonus',
  REFUND = 'refund',
}

export enum ActionType {
  PDF_UPLOAD = 'pdf_upload',
  FLASHCARD_GENERATION = 'flashcard_generation',
  QUIZ_GENERATION = 'quiz_generation',
  AI_CHAT_SESSION = 'ai_chat_session',
  IMAGE_UPLOAD = 'image_upload',
  SUMMARY_GENERATION = 'summary_generation',
}

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.creditTransactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('varchar')
  transactionType: TransactionType;

  @Column('varchar', { nullable: true })
  actionType: ActionType;

  @Column('int')
  credits: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  packageName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ default: false })
  isProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
