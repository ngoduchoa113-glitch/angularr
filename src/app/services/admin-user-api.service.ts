import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthUser, UserRole } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/user`;

@Injectable({ providedIn: 'root' })
export class AdminUserApiService {
  private readonly http = inject(HttpClient);

  list(role?: UserRole, keyword?: string): Observable<AuthUser[]> {
    const params: Record<string, string> = {};
    if (role) params['role'] = role;
    if (keyword) params['keyword'] = keyword;
    return this.http.get<AuthUser[]>(API_URL, { params });
  }

  grantAdmin(id: string): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${API_URL}/${id}/grant-admin`, {});
  }

  revokeAdmin(id: string): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${API_URL}/${id}/revoke-admin`, {});
  }
}
