import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { toApiError } from '../utils/api.utils';

/**
 * Normalises every HTTP error into an ApiError and sends the user back to login
 * when the session is no longer valid.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isLoginCall = req.url.endsWith('/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginCall) {
        // The login page already explains the expired session, so complete quietly
        // instead of also letting the calling page show an error toast
        authService.logout('expired');
        return EMPTY;
      }
      return throwError(() => toApiError(error));
    }),
  );
};
