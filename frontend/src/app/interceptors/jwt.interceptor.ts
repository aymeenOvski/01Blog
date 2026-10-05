import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  const request = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req;

  return next(request).pipe(

    catchError((error) => {

      // Invalid / expired JWT
      if (error.status === 401) {

        localStorage.removeItem('auth_token');

        router.navigate(['/login'], {
          replaceUrl: true
        });

        return throwError(() => error);
      }

      // Banned / blocked account
      const isBanned =
        error.status === 403 &&
        error.headers?.get('X-Account-Banned') === 'true';

      if (isBanned) {

        localStorage.removeItem('auth_token');

        router.navigate(['/login'], {
          replaceUrl: true,
          queryParams: {
            errorMessage: 'Your account is banned.'
          }
        });


        return throwError(() => error);
      }

      return throwError(() => error);
    })

  );
};