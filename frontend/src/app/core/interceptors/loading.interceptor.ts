import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { LoaderService } from '../services/loader.service';
import { ToastService } from '../services/toast.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  const toastService = inject(ToastService);

  const isMutateMethod = ['POST', 'PUT', 'DELETE'].includes(req.method);

  if (isMutateMethod) {
    loaderService.showMutate();
  } else {
    loaderService.showQuery();
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 429) {
        const msg = 'Too many requests! Please wait until the next minute.';
        toastService.showError(msg);
        const modifiedError = new HttpErrorResponse({
          error: { message: msg },
          headers: err.headers,
          status: err.status,
          statusText: err.statusText,
          url: err.url || undefined
        });
        return throwError(() => modifiedError);
      } else if (err.status >= 500) {
        toastService.showError(err.error?.message || 'Internal server error. Please try again.');
      }
      return throwError(() => err);
    }),
    finalize(() => {
      if (isMutateMethod) {
        loaderService.hideMutate();
      } else {
        loaderService.hideQuery();
      }
    })
  );
};
