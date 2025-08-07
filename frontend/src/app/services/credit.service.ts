import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreditBalance {
  balance: number;
  earned: number;
  spent: number;
}

export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description: string;
  isActive: boolean;
  isPopular: boolean;
  bonusCredits: number;
  discountPercentage?: number;
  validDays?: number;
}

export interface CreditTransaction {
  id: number;
  userId: number;
  transactionType: 'purchase' | 'consumption' | 'bonus' | 'refund';
  actionType?:
    | 'pdf_upload'
    | 'flashcard_generation'
    | 'quiz_generation'
    | 'ai_chat_session'
    | 'image_upload'
    | 'summary_generation';
  credits: number;
  amount?: number;
  currency?: string;
  packageName?: string;
  description: string;
  paymentId?: string;
  isProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditAvailability {
  hasCredits: boolean;
  requiredCredits: number;
  currentBalance: number;
}

export interface UsageStats {
  totalUploads: number;
  totalFlashcards: number;
  totalQuizzes: number;
  totalChatSessions: number;
  totalImages: number;
  totalSummaries: number;
}

export interface PurchaseRequest {
  packageId: number;
  paymentId: string;
  amount: number;
}

export interface ConsumeRequest {
  actionType:
    | 'pdf_upload'
    | 'flashcard_generation'
    | 'quiz_generation'
    | 'ai_chat_session'
    | 'image_upload'
    | 'summary_generation';
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CreditService {
  private creditBalanceSubject = new BehaviorSubject<CreditBalance>({
    balance: 0,
    earned: 0,
    spent: 0,
  });

  public creditBalance$ = this.creditBalanceSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCreditBalance();
  }

  // Get user's credit balance
  getCreditBalance(): Observable<CreditBalance> {
    return this.http.get<CreditBalance>(
      `${environment.apiUrl}/api/credits/balance`
    );
  }

  // Load credit balance and update subject
  loadCreditBalance(): void {
    this.getCreditBalance().subscribe({
      next: (balance) => {
        this.creditBalanceSubject.next(balance);
      },
      error: (error) => {
        console.error('Error loading credit balance:', error);
      },
    });
  }

  // Get available credit packages
  getAvailablePackages(): Observable<CreditPackage[]> {
    return this.http.get<CreditPackage[]>(
      `${environment.apiUrl}/api/credits/packages`
    );
  }

  // Get specific package by ID
  getPackageById(id: number): Observable<CreditPackage> {
    return this.http.get<CreditPackage>(
      `${environment.apiUrl}/api/credits/packages/${id}`
    );
  }

  // Get transaction history
  getTransactionHistory(): Observable<CreditTransaction[]> {
    return this.http.get<CreditTransaction[]>(
      `${environment.apiUrl}/api/credits/transactions`
    );
  }

  // Get usage statistics
  getUsageStats(): Observable<UsageStats> {
    return this.http.get<UsageStats>(
      `${environment.apiUrl}/api/credits/usage-stats`
    );
  }

  // Check credit availability for an action
  checkCreditAvailability(
    actionType: ConsumeRequest['actionType']
  ): Observable<CreditAvailability> {
    return this.http.post<CreditAvailability>(
      `${environment.apiUrl}/api/credits/check-availability`,
      {
        actionType,
      }
    );
  }

  // Purchase credits
  purchaseCredits(request: PurchaseRequest): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/credits/purchase`,
      request
    );
  }

  // Consume credits for an action
  consumeCredits(request: ConsumeRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/credits/consume`, request);
  }

  // Add bonus credits (admin function)
  addBonusCredits(credits: number, reason: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/credits/add-bonus`, {
      credits,
      reason,
    });
  }

  // Helper method to check if user has enough credits for an action
  async hasEnoughCredits(
    actionType: ConsumeRequest['actionType']
  ): Promise<boolean> {
    try {
      const availability = await this.checkCreditAvailability(
        actionType
      ).toPromise();
      return availability?.hasCredits || false;
    } catch (error) {
      console.error('Error checking credit availability:', error);
      return false;
    }
  }

  // Helper method to consume credits for an action
  async consumeCreditsForAction(
    actionType: ConsumeRequest['actionType'],
    description?: string
  ): Promise<boolean> {
    try {
      await this.consumeCredits({ actionType, description }).toPromise();
      this.loadCreditBalance(); // Refresh balance
      return true;
    } catch (error) {
      console.error('Error consuming credits:', error);
      return false;
    }
  }

  // Get current credit balance from subject
  getCurrentBalance(): CreditBalance {
    return this.creditBalanceSubject.value;
  }

  // Format credits for display
  formatCredits(credits: number): string {
    return credits.toLocaleString();
  }

  // Calculate cost per credit for a package
  calculateCostPerCredit(pkg: CreditPackage): number {
    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
    return pkg.price / totalCredits;
  }

  // Calculate savings percentage for a package
  calculateSavings(pkg: CreditPackage): number {
    const costPerCredit = this.calculateCostPerCredit(pkg);
    const baseCostPerCredit = 9.9; // Starter pack cost per credit
    return ((baseCostPerCredit - costPerCredit) / baseCostPerCredit) * 100;
  }
}
