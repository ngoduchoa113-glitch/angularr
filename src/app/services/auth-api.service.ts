import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/login`, { email, password });
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/register`, { email, password });
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/refresh`, { refreshToken });
  }

  logout(refreshToken: string): Observable<{ success: true }> {
    return this.http.post<{ success: true }>(`${API_URL}/logout`, { refreshToken });
  }

  forgotPassword(email: string): Observable<{ success: true }> {
    return this.http.post<{ success: true }>(`${API_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ success: true }> {
    return this.http.post<{ success: true }>(`${API_URL}/reset-password`, { token, newPassword });
  }
}
