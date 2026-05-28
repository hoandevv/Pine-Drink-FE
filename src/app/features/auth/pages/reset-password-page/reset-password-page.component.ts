import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss']
})
export class ResetPasswordPageComponent implements OnInit {
  resetForm!: FormGroup;
  submitting = false;
  errorMessage = '';
  resetToken = '';
  email = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get reset token from query params
    this.route.queryParams.subscribe((params) => {
      this.resetToken = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.resetToken) {
        this.errorMessage = 'Token đặt lại mật khẩu không hợp lệ. Vui lòng thử lại.';
      }
    });

    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  submit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.resetToken) {
      this.errorMessage = 'Token đặt lại mật khẩu không hợp lệ.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const request = {
      newPassword: this.resetForm.value.password,
      confirmPassword: this.resetForm.value.confirmPassword
    };

    this.authService.resetPassword(request, this.resetToken).subscribe({
      next: () => {
        this.submitting = false;
        // Navigate to login with success message
        this.router.navigate(['/auth/login'], {
          queryParams: { resetSuccess: 'true' }
        });
      },
      error: (error) => {
        this.submitting = false;
        this.errorMessage = error?.error?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      }
    });
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }
}
