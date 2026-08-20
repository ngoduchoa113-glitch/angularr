import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderModel } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/orders`;

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);

  create(recipeId: string, servings: number, rewardId?: string): Observable<OrderModel> {
    return this.http.post<OrderModel>(API_URL, { recipeId, servings, rewardId });
  }

  getMine(): Observable<OrderModel[]> {
    return this.http.get<OrderModel[]>(API_URL);
  }

  update(id: string, servings: number): Observable<OrderModel> {
    return this.http.patch<OrderModel>(`${API_URL}/${id}`, { servings });
  }

  cancel(id: string): Observable<OrderModel> {
    return this.http.patch<OrderModel>(`${API_URL}/${id}/cancel`, {});
  }
}
