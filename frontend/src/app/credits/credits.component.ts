import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditService, CreditPackage, CreditBalance } from '../services/credit.service';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.css']
})
export class CreditsComponent implements OnInit {
  packages: CreditPackage[] = [];
  creditBalance: CreditBalance = { balance: 0, earned: 0, spent: 0 };
  selectedPackage: CreditPackage | null = null;
  isLoading = false;
  showPurchaseModal = false;

  constructor(private creditService: CreditService) {}

  ngOnInit() {
    this.loadPackages();
    this.loadCreditBalance();
  }

  loadPackages() {
    this.creditService.getAvailablePackages().subscribe({
      next: (packages) => {
        this.packages = packages;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
      }
    });
  }

  loadCreditBalance() {
    this.creditService.creditBalance$.subscribe({
      next: (balance) => {
        this.creditBalance = balance;
      },
      error: (error) => {
        console.error('Error loading credit balance:', error);
      }
    });
  }

  selectPackage(pkg: CreditPackage) {
    this.selectedPackage = pkg;
    this.showPurchaseModal = true;
  }

  closePurchaseModal() {
    this.showPurchaseModal = false;
    this.selectedPackage = null;
  }

  async purchaseCredits() {
    if (!this.selectedPackage) return;

    this.isLoading = true;
    
    // Simulate payment process (in real app, integrate with payment gateway)
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.creditService.purchaseCredits({
        packageId: this.selectedPackage.id,
        paymentId,
        amount: this.selectedPackage.price
      }).toPromise();

      // Refresh credit balance
      this.creditService.loadCreditBalance();
      
      this.closePurchaseModal();
      // Show success message
      alert(`Successfully purchased ${this.selectedPackage.credits} credits!`);
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to purchase credits. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  getTotalCredits(pkg: CreditPackage): number {
    return pkg.credits + (pkg.bonusCredits || 0);
  }

  getCostPerCredit(pkg: CreditPackage): number {
    return this.creditService.calculateCostPerCredit(pkg);
  }

  getSavings(pkg: CreditPackage): number {
    return this.creditService.calculateSavings(pkg);
  }

  formatPrice(price: number): string {
    return `₹${price.toFixed(2)}`;
  }

  formatCredits(credits: number): string {
    return this.creditService.formatCredits(credits);
  }
} 