import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  constructor(private router: Router) {}

  getStarted() {
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  selectPlan(plan: string) {
    // Navigate to registration page with plan selection
    this.router.navigate(['/register'], { 
      queryParams: { plan: plan.toLowerCase() } 
    });
  }
}
