import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss']
})
export class ForgotPasswordPageComponent implements OnInit {
  forgotForm!: FormGroup;
  submitting = false;
  success = false;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit(): void {
    if (this.forgotForm.valid) {
      this.submitting = true;
      // Mock API call
      setTimeout(() => {
        this.submitting = false;
        this.success = true;
      }, 1500);
    } else {
      this.forgotForm.markAllAsTouched();
    }
  }
}
