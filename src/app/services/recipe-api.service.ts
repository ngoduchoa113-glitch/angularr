import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RecipeModel } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/recipes`;

@Injectable({ providedIn: 'root' })
export class RecipeApiService {
  private readonly http = inject(HttpClient);

  getAll(keyword?: string): Observable<RecipeModel[]> {
    const params = keyword?.trim() ? { keyword: keyword.trim() } : undefined;
    return this.http.get<RecipeModel[]>(API_URL, { params });
  }

  getById(id: string): Observable<RecipeModel> {
    return this.http.get<RecipeModel>(`${API_URL}/${id}`);
  }

  create(recipe: Omit<RecipeModel, 'id' | 'isFavorite'>): Observable<RecipeModel> {
    return this.http.post<RecipeModel>(API_URL, recipe);
  }

  update(id: string, changes: Partial<Omit<RecipeModel, 'id'>>): Observable<RecipeModel> {
    return this.http.patch<RecipeModel>(`${API_URL}/${id}`, changes);
  }

  delete(id: string): Observable<RecipeModel> {
    return this.http.delete<RecipeModel>(`${API_URL}/${id}`);
  }
}
