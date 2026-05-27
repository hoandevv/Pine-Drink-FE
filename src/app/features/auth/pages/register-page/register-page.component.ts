import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;
  submitting = false;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.registerForm.valid) {
      this.submitting = true;
      // Mock API call
      setTimeout(() => {
        this.submitting = false;
        this.router.navigate(['/auth/login']);
      }, 1500);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
