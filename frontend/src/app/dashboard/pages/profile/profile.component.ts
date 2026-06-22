import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import type { User } from '../../../core/models/user.model';
import { TitleCasePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  user = signal<User | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (u) => {
        this.user.set(u);
        this.isLoading.set(false);
      },
      error: (e) => {
        this.toastService.showError('Failed to retrieve user profile.');
        this.isLoading.set(false);
      }
    });
  }
}
