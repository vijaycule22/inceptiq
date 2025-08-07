import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credit_packages')
export class CreditPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  credits: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPopular: boolean;

  @Column({ nullable: true })
  bonusCredits: number;

  @Column({ nullable: true })
  discountPercentage: number;

  @Column({ nullable: true })
  validDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 