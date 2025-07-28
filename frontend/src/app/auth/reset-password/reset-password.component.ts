import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  resetData = {
    password: '',
    confirmPassword: '',
  };

  token = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token from URL query parameter
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage =
          'Invalid reset link. Please request a new password reset.';
      }
    });
  }

  onSubmit() {
    if (!this.token) {
      this.errorMessage =
        'Invalid reset link. Please request a new password reset.';
      return;
    }

    if (this.resetData.password !== this.resetData.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.resetData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService
      .resetPassword(this.token, this.resetData.password)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;

          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to reset password. Please try again.';
        },
      });
  }
}
