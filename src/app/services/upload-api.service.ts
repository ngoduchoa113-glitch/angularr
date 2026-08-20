import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';

export interface UploadImageResponse {
  url: string;
}

// FE-12: gửi file thật lên backend (multipart/form-data) thay vì nhúng base64
// vào JSON — xem uploads.controller.ts phía NestJS.
@Injectable({ providedIn: 'root' })
export class UploadApiService {
  private readonly http = inject(HttpClient);

  uploadImage(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadImageResponse>(`${API_BASE_URL}/uploads/image`, formData);
  }

  // Image Moderation: admin nhập URL ảnh món ăn -> backend tự fetch (an toàn, chống SSRF)
  // + kiểm duyệt + tải về lưu nội bộ -> trả về URL nội bộ mới, KHÔNG lưu thẳng URL ngoài
  // (xem uploads.controller.ts#uploadFromUrl). Trả cùng shape với uploadImage() để 2 luồng
  // dùng chung 1 chỗ gán vào form.
  moderateUrl(url: string): Observable<UploadImageResponse> {
    return this.http.post<UploadImageResponse>(`${API_BASE_URL}/uploads/from-url`, { url });
  }
}
