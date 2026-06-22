import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../../core/services/token.service';

export const noAuthGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  return tokenService.hasTokens() ? router.createUrlTree(['/dashboard']) : true;
};
