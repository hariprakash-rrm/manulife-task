import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { registerSchema } from '../../schemas/auth.schemas';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  loading = signal(false);
  serverError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  submit(): void {
    const parsed = registerSchema.safeParse(this.form.getRawValue());
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const errs: Record<string, string> = {};
      for (const [k, msgs] of Object.entries(flat.fieldErrors)) {
        errs[k] = (msgs as string[])[0];
      }
      if (flat.formErrors.length > 0) errs['confirmPassword'] = flat.formErrors[0];
      this.fieldErrors.set(errs);
      return;
    }

    this.fieldErrors.set({});
    this.serverError.set(null);
    this.loading.set(true);

    const { email, password } = parsed.data;
    this.authService.register(email, password).subscribe({
      next: () => {
        this.toastService.showSuccess('Account created successfully! Welcome to NovaInvest.');
        this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        const errorMsg = e.error?.message ?? 'Registration failed';
        this.serverError.set(errorMsg);
        this.toastService.showError(errorMsg);
        this.loading.set(false);
      },
    });
  }
}
