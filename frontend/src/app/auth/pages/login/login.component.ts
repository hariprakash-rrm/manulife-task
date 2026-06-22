import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { loginSchema } from '../../schemas/auth.schemas';
import { ToastService } from '../../../core/services/toast.service';
import { TestsComponent } from '../../../dashboard/pages/tests/tests.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TestsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  serverError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  submit(): void {
    const parsed = loginSchema.safeParse(this.form.getRawValue());
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const [k, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        errs[k] = (msgs as string[])[0];
      }
      this.fieldErrors.set(errs);
      return;
    }

    this.fieldErrors.set({});
    this.serverError.set(null);
    this.loading.set(true);

    const { email, password } = parsed.data;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.toastService.showSuccess('Welcome back! Logged in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        const errorMsg = e.error?.message ?? 'Invalid credentials';
        this.serverError.set(errorMsg);
        this.toastService.showError(errorMsg);
        this.loading.set(false);
      },
    });
  }
}
