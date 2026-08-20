import { Injectable, inject, signal } from '@angular/core';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { AuthStore } from './auth-store';
import { NotificationEvent } from '../models';
import { API_BASE_URL } from '../api-base-url';

// Access token sống 15 phút (xem BE ACCESS_TOKEN_TTL_MIN) — chủ động mở lại kết nối
// bằng token mới nhất trước khi token cũ hết hạn, thay vì để EventSource tự reconnect
// bằng đúng URL/header cũ (lúc đó token đã hỏng, polyfill không tự cập nhật lại).
const RECONNECT_INTERVAL_MS = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly authStore = inject(AuthStore);

  private eventSource: EventSourcePolyfill | null = null;
  private reconnectTimerId: ReturnType<typeof setInterval> | null = null;

  // Sự kiện SSE gần nhất — các trang liên quan (đơn của tôi, quản trị đơn) tự
  // effect() theo dõi signal này để biết lúc nào cần reload danh sách.
  readonly lastEvent = signal<NotificationEvent | null>(null);

  connect(): void {
    this.teardown();

    const token = this.authStore.token();
    if (!token) {
      return;
    }

    this.eventSource = new EventSourcePolyfill(`${API_BASE_URL}/notifications/stream`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    this.eventSource.onmessage = (event) => {
      try {
        this.lastEvent.set(JSON.parse(event.data) as NotificationEvent);
      } catch {
        // Payload không hợp lệ -> bỏ qua, không làm crash luồng thông báo.
      }
    };

    this.reconnectTimerId = setInterval(() => this.connect(), RECONNECT_INTERVAL_MS);
  }

  disconnect(): void {
    this.teardown();
  }

  private teardown(): void {
    this.eventSource?.close();
    this.eventSource = null;

    if (this.reconnectTimerId !== null) {
      clearInterval(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
  }
}
