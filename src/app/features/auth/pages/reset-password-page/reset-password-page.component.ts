import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss']
})
export class ResetPasswordPageComponent implements OnInit {
  resetForm!: FormGroup;
  submitting = false;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.resetForm.valid) {
      if (this.resetForm.get('password')?.value !== this.resetForm.get('confirmPassword')?.value) {
        this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
        return;
      }

      this.submitting = true;
      // Mock API call
      setTimeout(() => {
        this.submitting = false;
        this.router.navigate(['/auth/login']);
      }, 1500);
    } else {
      this.resetForm.markAllAsTouched();
    }
  }
}
