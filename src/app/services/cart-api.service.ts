import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CartItemModel, OrderModel } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/cart`;

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);

  addItem(recipeId: string, servings: number): Observable<CartItemModel> {
    return this.http.post<CartItemModel>(API_URL, { recipeId, servings });
  }

  getCart(): Observable<CartItemModel[]> {
    return this.http.get<CartItemModel[]>(API_URL);
  }

  updateServings(id: string, servings: number): Observable<CartItemModel> {
    return this.http.patch<CartItemModel>(`${API_URL}/${id}`, { servings });
  }

  removeItem(id: string): Observable<{ success: true }> {
    return this.http.delete<{ success: true }>(`${API_URL}/${id}`);
  }

  checkout(itemIds: string[], rewardId?: string): Observable<OrderModel[]> {
    return this.http.post<OrderModel[]>(`${API_URL}/checkout`, { itemIds, rewardId });
  }
}
