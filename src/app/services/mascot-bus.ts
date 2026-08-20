import { Injectable, signal } from '@angular/core';

// Kênh thông báo nhẹ giữa các tính năng nghiệp vụ (yêu thích, đặt món) và con mèo linh
// vật (cat-mascot) — tách riêng để RecipeStore/OrderStore/component nghiệp vụ không cần
// biết gì về sự tồn tại của mascot, chỉ "bắn tín hiệu" qua đây. Dùng số đếm (không phải
// boolean) để effect() ở phía mascot luôn nhận diện được lần bắn MỚI, kể cả khi bắn liên
// tiếp trước khi animation trước đó kết thúc.
@Injectable({ providedIn: 'root' })
export class MascotBus {
  readonly favoritedPulse = signal(0);
  readonly orderPlacedPulse = signal(0);

  notifyFavorited(): void {
    this.favoritedPulse.update((n) => n + 1);
  }

  notifyOrderPlaced(): void {
    this.orderPlacedPulse.update((n) => n + 1);
  }
}
