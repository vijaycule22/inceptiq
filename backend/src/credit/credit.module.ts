import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditController } from '../controllers/credit.controller';
import { CreditService } from '../services/credit.service';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { CreditPackage } from '../entities/credit-package.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreditTransaction, CreditPackage, User])],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
