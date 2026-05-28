import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss']
})
export class ForgotPasswordPageComponent implements OnInit {
  forgotForm!: FormGroup;
  otpForm!: FormGroup;
  submitting = false;
  verifying = false;
  otpSent = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  submit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.submitting = false;
        this.otpSent = true;
        this.successMessage = 'Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn.';
      },
      error: (error) => {
        this.submitting = false;
        this.errorMessage = error?.error?.message || 'Không thể gửi OTP. Vui lòng kiểm tra email và thử lại.';
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.verifying = true;
    this.errorMessage = '';

    this.authService.verifyForgotPasswordOtp({ email: this.email, otp: this.otpForm.value.otp }).subscribe({
      next: (response) => {
        this.verifying = false;
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { token: response.resetToken, email: this.email }
        });
      },
      error: (error) => {
        this.verifying = false;
        this.errorMessage = error?.error?.message || 'OTP không hợp lệ hoặc đã hết hạn.';
      }
    });
  }

  resendOtp(): void {
    this.otpForm.reset();
    this.submit();
  }

  get email(): string {
    return this.forgotForm.get('email')?.value;
  }
}
