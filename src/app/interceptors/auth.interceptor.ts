import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth-store';

// Endpoint auth công khai — không cần đính access token, và 401 ở đây không nên
// kích hoạt vòng refresh (sẽ tự gây vòng lặp vô hạn với chính /auth/refresh).
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path));
  const token = authStore.token();
  const authReq = token && !isPublicAuthCall
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!isUnauthorized || isPublicAuthCall || !authStore.isAuthenticated()) {
        if (isUnauthorized && authStore.isAuthenticated()) {
          authStore.logout();
          router.navigate(['/auth']);
        }
        return throwError(() => error);
      }

      // Access token hết hạn -> thử refresh 1 lần rồi phát lại request gốc.
      // catchError ở đây CHỈ bọc riêng refreshSession() — nếu để switchMap trong cùng
      // pipe, lỗi của chính request gọi lại (vd 401 nghiệp vụ như sai mật khẩu) sẽ bị
      // bắt nhầm thành "refresh thất bại" và đăng xuất oan người dùng.
      return from(authStore.refreshSession()).pipe(
        catchError((refreshError: unknown) => {
          authStore.logout();
          router.navigate(['/auth']);
          return throwError(() => refreshError);
        }),
        switchMap((newToken) => next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))),
      );
    }),
  );
};
