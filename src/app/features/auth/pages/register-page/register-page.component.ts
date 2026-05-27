import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiError } from '../../../../shared/models/api-error.model';
import { RegisterRequest } from '../../models/register.model';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;
  submitting = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
        fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        phone: ['', [Validators.pattern(/^[0-9]{10,20}$/)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(100),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ]
        ],
        confirmPassword: ['', Validators.required],
        siteKey: ['PINE_DRINK_WEB', [Validators.required, Validators.maxLength(100)]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.registerForm.getRawValue();
    const request: RegisterRequest = {
      username: formValue.username.trim(),
      password: formValue.password,
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim().toLowerCase(),
      phone: formValue.phone?.trim() || null,
      siteKey: formValue.siteKey
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.toastService.success('Tạo tài khoản thành công. Vui lòng nhập OTP để kích hoạt.');
        this.navigateToVerifyOtp(response.email);
      },
      error: (error: ApiError) => {
        this.submitting = false;

        if (error.errorCode === 'AUTH_014') {
          this.toastService.warning('Email này đã đăng ký nhưng có thể chưa kích hoạt. Vui lòng xác thực OTP hoặc gửi lại mã.');
          this.navigateToVerifyOtp(request.email, true);
        }
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
      return;
    }

    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private navigateToVerifyOtp(email: string, resend = false): void {
    sessionStorage.setItem('pendingRegisterEmail', email);
    this.router.navigate(['/auth/verify-otp'], {
      queryParams: { email, ...(resend ? { resend: true } : {}) }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
