import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-verify-otp-page',
  templateUrl: './verify-otp-page.component.html',
  styleUrls: ['./verify-otp-page.component.scss']
})
export class VerifyOtpPageComponent implements OnInit {
  readonly otpForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
  });

  submitting = false;
  resending = false;
  emailLocked = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') || sessionStorage.getItem('pendingRegisterEmail');

    if (email) {
      this.otpForm.patchValue({ email });
      this.emailLocked = true;
      this.otpForm.controls.email.disable();
    }

    if (this.route.snapshot.queryParamMap.get('resend') === 'true') {
      this.resendOtp();
    }
  }

  submit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.authService.verifyRegistrationOtp(this.otpForm.getRawValue()).subscribe({
      next: () => {
        sessionStorage.removeItem('pendingRegisterEmail');
        this.toastService.success('Kích hoạt tài khoản thành công. Bạn có thể đăng nhập ngay.');
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  resendOtp(): void {
    const email = this.otpForm.getRawValue().email.trim().toLowerCase();
    if (this.otpForm.controls.email.invalid) {
      this.otpForm.controls.email.markAsTouched();
      return;
    }

    this.resending = true;
    this.authService.resendRegistrationOtp({ email }).subscribe({
      next: () => {
        sessionStorage.setItem('pendingRegisterEmail', email);
        this.toastService.success('OTP mới đã được gửi tới email của bạn.');
      },
      error: () => {
        this.resending = false;
      },
      complete: () => {
        this.resending = false;
      }
    });
  }
}
