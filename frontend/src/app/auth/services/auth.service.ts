import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../../core/services/token.service';
import { ToastService } from '../../core/services/toast.service';
import type { AuthResponse, RefreshResponse, User } from '../../core/models/user.model';

const API = '/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private toastService = inject(ToastService);

  private currentUser$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this.currentUser$.asObservable();

  get isLoggedIn(): boolean {
    return this.tokenService.hasTokens();
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API}/register`, { email, password })
      .pipe(tap((r) => this.handleAuth(r)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API}/login`, { email, password })
      .pipe(tap((r) => this.handleAuth(r)));
  }

  refresh(): Observable<RefreshResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.tokenService.getRefreshToken()}`,
    });
    return this.http
      .post<RefreshResponse>(`${API}/refresh`, {}, { headers })
      .pipe(tap((r) => this.tokenService.setTokens(r.accessToken, r.refreshToken)));
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(`${API}/me`)
      .pipe(tap((u) => this.currentUser$.next(u)));
  }

  logout(): void {
    this.http.post(`${API}/logout`, {}).subscribe({
      complete: () => {
        this.toastService.showSuccess('Logged out successfully.');
        this.clearSession();
      },
      error: () => {
        this.toastService.showSuccess('Logged out successfully.');
        this.clearSession();
      }
    });
  }

  clearSession(): void {
    this.tokenService.clearTokens();
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  private handleAuth(res: AuthResponse): void {
    this.tokenService.setTokens(res.accessToken, res.refreshToken);
    this.currentUser$.next(res.user);
  }
}
