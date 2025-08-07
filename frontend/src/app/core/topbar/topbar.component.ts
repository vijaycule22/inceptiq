import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { CreditService, CreditBalance } from '../../services/credit.service';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    ToggleButtonModule,
    BadgeModule,
    AvatarModule,
    MenuModule,
    FormsModule,
    ProgressIndicatorComponent,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent implements OnInit {
  @Input() topic: string = '';
  @Input() panel:
    | 'summary'
    | 'flashcards'
    | 'quiz'
    | 'dashboard'
    | 'progress'
    | 'leaderboard'
    | 'notes' = 'summary';
  currentUser: User | null = null;
  creditBalance: CreditBalance | null = null;
  showFallbackAvatar = false;
  profileItems: MenuItem[] = [
    {
      label: 'My Profile',
      icon: 'pi pi-user',
      command: () => this.navigateToProfile(),
    },
    {
      label: 'Credits & Packages',
      icon: 'pi pi-credit-card',
      command: () => this.navigateToCredits(),
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => this.navigateToSettings(),
    },
    {
      label: 'Help & Support',
      icon: 'pi pi-question-circle',
      command: () => this.showHelp(),
    },
    {
      label: 'About InceptIQ',
      icon: 'pi pi-info-circle',
      command: () => this.showAbout(),
    },
    { separator: true },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      style: {
        color: 'red',
      },
      command: () => this.logout(),
    },
  ];

  constructor(
    private authService: AuthService, 
    private creditService: CreditService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadCreditBalance();
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

  showProfileMenu(event: Event, menu: any) {
    menu.toggle(event);
  }

  navigateToProfile() {
    // TODO: Implement profile navigation
    console.log('Navigate to profile');
  }

  navigateToCredits() {
    this.router.navigate(['/app/credits']);
  }

  navigateToSettings() {
    // TODO: Implement settings navigation
    console.log('Navigate to settings');
  }

  showHelp() {
    // TODO: Implement help modal or navigation
    console.log('Show help and support');
  }

  showAbout() {
    // TODO: Implement about modal or navigation
    console.log('Show about InceptIQ');
  }

  changePassword() {
    // TODO: Implement change password functionality
    console.log('Change password');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
