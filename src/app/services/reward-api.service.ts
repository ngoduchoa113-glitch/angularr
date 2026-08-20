import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RewardModel } from '../models';
import { API_BASE_URL } from '../api-base-url';

const API_URL = `${API_BASE_URL}/rewards`;

@Injectable({ providedIn: 'root' })
export class RewardApiService {
  private readonly http = inject(HttpClient);

  catchRat(): Observable<RewardModel> {
    return this.http.post<RewardModel>(`${API_URL}/catch-rat`, {});
  }

  getMine(): Observable<RewardModel[]> {
    return this.http.get<RewardModel[]>(`${API_URL}/mine`);
  }
}
