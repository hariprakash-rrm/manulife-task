import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import type { User } from '../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = signal<User | null>(null);
  isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (u) => {
        this.user.set(u);
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(collapsed => !collapsed);
  }

  logout(): void {
    this.authService.logout();
  }
}
