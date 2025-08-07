import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreditService } from '../services/credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActionType } from '../entities/credit-transaction.entity';

@Controller('api/credits')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  async getUserCredits(@Request() req: { user: { id: number } }) {
    try {
      const userId = req.user.id;
      return await this.creditService.getUserCredits(userId);
    } catch (error) {
      throw new HttpException(
        'Failed to get user credits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('packages')
  async getAvailablePackages() {
    try {
      return await this.creditService.getAvailablePackages();
    } catch (error) {
      throw new HttpException(
        'Failed to get available packages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('packages/:id')
  async getPackageById(@Param('id') id: string) {
    try {
      const packageId = parseInt(id);
      return await this.creditService.getPackageById(packageId);
    } catch (error) {
      throw new HttpException(
        'Package not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('transactions')
  async getTransactionHistory(@Request() req: { user: { id: number } }) {
    try {
      const userId = req.user.id;
      return await this.creditService.getTransactionHistory(userId);
    } catch (error) {
      throw new HttpException(
        'Failed to get transaction history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usage-stats')
  async getUsageStats(@Request() req: { user: { id: number } }) {
    try {
      const userId = req.user.id;
      return await this.creditService.getCreditUsageStats(userId);
    } catch (error) {
      throw new HttpException(
        'Failed to get usage stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check-availability')
  async checkCreditAvailability(
    @Request() req: { user: { id: number } },
    @Body() body: { actionType: ActionType },
  ) {
    try {
      const userId = req.user.id;
      return await this.creditService.checkCreditAvailability(userId, body.actionType);
    } catch (error) {
      throw new HttpException(
        'Failed to check credit availability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('purchase')
  async purchaseCredits(
    @Request() req: { user: { id: number } },
    @Body() body: {
      packageId: number;
      paymentId: string;
      amount: number;
    },
  ) {
    try {
      const userId = req.user.id;
      const packageDetails = await this.creditService.getPackageById(body.packageId);
      
      // Add base credits
      await this.creditService.addCredits(
        userId,
        packageDetails.credits,
        packageDetails.name,
        body.paymentId,
      );

      // Add bonus credits if any
      if (packageDetails.bonusCredits > 0) {
        await this.creditService.addBonusCredits(
          userId,
          packageDetails.bonusCredits,
          `Bonus for ${packageDetails.name} package`,
        );
      }

      return {
        success: true,
        message: `Successfully purchased ${packageDetails.credits} credits`,
        totalCredits: packageDetails.credits + packageDetails.bonusCredits,
        packageName: packageDetails.name,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to purchase credits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('consume')
  async consumeCredits(
    @Request() req: { user: { id: number } },
    @Body() body: { actionType: ActionType; description?: string },
  ) {
    try {
      const userId = req.user.id;
      const success = await this.creditService.consumeCredits(
        userId,
        body.actionType,
        body.description,
      );

      if (!success) {
        throw new HttpException(
          'Insufficient credits',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      return {
        success: true,
        message: 'Credits consumed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to consume credits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('add-bonus')
  async addBonusCredits(
    @Request() req: { user: { id: number } },
    @Body() body: { credits: number; reason: string },
  ) {
    try {
      const userId = req.user.id;
      await this.creditService.addBonusCredits(userId, body.credits, body.reason);
      
      return {
        success: true,
        message: `Added ${body.credits} bonus credits`,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to add bonus credits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 