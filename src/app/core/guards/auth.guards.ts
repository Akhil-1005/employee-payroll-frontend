import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Only logged-in users. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.getToken() !== null ? true : inject(Router).createUrlTree(['/login']);
};

/** Only admins. Other users are sent to their default page. */
export const adminGuard: CanActivateFn = () => {
  return inject(AuthService).isAdmin() ? true : inject(Router).createUrlTree(['/']);
};

/** Login page is only for logged-out users. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.getToken() === null ? true : inject(Router).createUrlTree(['/']);
};
