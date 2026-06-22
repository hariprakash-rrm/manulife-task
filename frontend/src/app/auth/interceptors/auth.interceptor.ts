import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../../core/services/token.service';
import { AuthService } from '../services/auth.service';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  const isAuthEndpoint = AUTH_ENDPOINTS.some((url) => req.url.includes(url));

  // Refresh endpoint sends its own Bearer (refresh token) — don't overwrite
  const token = tokenService.getAccessToken();
  const authReq = !req.url.includes('/auth/refresh') && token
    ? addBearer(req, token)
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't retry for auth endpoints or non-401 errors
      if (err.status !== 401 || isAuthEndpoint) {
        return throwError(() => err);
      }

      // Access token expired — try silent refresh then replay original request
      return authService.refresh().pipe(
        switchMap((res) => next(addBearer(req, res.accessToken))),
        catchError((refreshErr) => {
          authService.clearSession();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
