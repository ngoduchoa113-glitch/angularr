import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderModel, OrderStats, OrderStatus } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/admin/orders`;

@Injectable({ providedIn: 'root' })
export class AdminOrderApiService {
  private readonly http = inject(HttpClient);

  getAll(status?: OrderStatus | null): Observable<OrderModel[]> {
    const params = status ? { status } : undefined;
    return this.http.get<OrderModel[]>(API_URL, { params });
  }

  getStats(): Observable<OrderStats> {
    return this.http.get<OrderStats>(`${API_URL}/stats`);
  }

  updateStatus(id: string, status: OrderStatus, cancelReason?: string): Observable<OrderModel> {
    return this.http.patch<OrderModel>(`${API_URL}/${id}/status`, { status, cancelReason });
  }
}
