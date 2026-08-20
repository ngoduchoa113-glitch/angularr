import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, AuthUser } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/user/me`;

export interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(API_URL);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser> {
    return this.http.patch<AuthUser>(API_URL, payload);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/change-password`, { currentPassword, newPassword });
  }

  deleteAccount(password: string): Observable<{ success: true }> {
    return this.http.request<{ success: true }>('DELETE', API_URL, { body: { password } });
  }
}
