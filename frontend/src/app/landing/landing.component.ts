import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit, AfterViewInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize any component logic
  }

  ngAfterViewInit() {
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
      this.initializeScrollAnimations();
    }, 100);
  }

  getStarted() {
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  selectPlan(plan: string) {
    // Navigate to registration page with plan selection
    this.router.navigate(['/register'], {
      queryParams: { plan: plan.toLowerCase() },
    });
  }

  private initializeScrollAnimations() {
    // Create intersection observer for scroll-triggered animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only add animation if it doesn't already have it
            if (!entry.target.classList.contains('scroll-animated')) {
              // Small delay to prevent flash
              setTimeout(() => {
                entry.target.classList.add('scroll-animated');
                entry.target.classList.add('animate-fade-in-up');
              }, 50);
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Observe sections that should animate on scroll (only those with data-animate attribute)
    const sections = document.querySelectorAll('section[data-animate="true"]');
    sections.forEach((section) => {
      observer.observe(section);
    });

    // Handle scroll to top button visibility
    this.handleScrollToTopVisibility();
  }

  private handleScrollToTopVisibility() {
    const scrollToTopButton = document.getElementById('scrollToTop');
    if (scrollToTopButton) {
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          scrollToTopButton.classList.remove('opacity-0');
          scrollToTopButton.classList.add('opacity-100');
        } else {
          scrollToTopButton.classList.add('opacity-0');
          scrollToTopButton.classList.remove('opacity-100');
        }
      });
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
