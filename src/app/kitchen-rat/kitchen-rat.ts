import { Component, OnDestroy, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RewardApiService } from '../services/reward-api.service';

const MIN_INTERVAL_MS = 90_000; // 1.5 phút
const MAX_INTERVAL_MS = 240_000; // 4 phút
const VISIBLE_DURATION_MS = 7_000;
const HOP_INTERVAL_MS = 1_500;

// Easter egg "bắt chuột trong bếp" — cố tình đơn giản (mục 19 yêu cầu gốc: "không cần
// gameplay lớn"): 1 emoji xuất hiện ngẫu nhiên, tự "chạy" (đổi vị trí vài giây/lần)
// trong ~7s rồi biến mất nếu không bấm kịp. Giới hạn 1 lần/ngày là logic THẬT ở backend
// (reward.service.ts) — component này chỉ là lớp game trang trí phía trên.
@Component({
  selector: 'app-kitchen-rat',
  templateUrl: './kitchen-rat.html',
  styleUrl: './kitchen-rat.css',
})
export class KitchenRat implements OnDestroy {
  private readonly rewardApi = inject(RewardApiService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly visible = signal(false);
  protected readonly posX = signal(50);
  protected readonly posY = signal(50);
  protected readonly catching = signal(false);

  // Biết chắc hôm nay đã bắt rồi (server đã xác nhận) thì thôi không cho xuất hiện lại
  // trong phiên này nữa — tránh lừa người dùng bấm vào thứ chắc chắn sẽ báo lỗi.
  private alreadyCaughtToday = false;

  private appearTimer?: ReturnType<typeof setTimeout>;
  private hopTimer?: ReturnType<typeof setInterval>;
  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.scheduleNextAppearance();
  }

  ngOnDestroy(): void {
    clearTimeout(this.appearTimer);
    clearInterval(this.hopTimer);
    clearTimeout(this.hideTimer);
  }

  private scheduleNextAppearance(): void {
    clearTimeout(this.appearTimer);
    const delay = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
    this.appearTimer = setTimeout(() => this.appear(), delay);
  }

  private appear(): void {
    if (this.alreadyCaughtToday) {
      return;
    }

    this.moveToRandomSpot();
    this.visible.set(true);

    clearInterval(this.hopTimer);
    this.hopTimer = setInterval(() => this.moveToRandomSpot(), HOP_INTERVAL_MS);

    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.disappear(), VISIBLE_DURATION_MS);
  }

  private disappear(): void {
    this.visible.set(false);
    clearInterval(this.hopTimer);
    this.scheduleNextAppearance();
  }

  private moveToRandomSpot(): void {
    // Né mép màn hình + thanh toolbar phía trên (tính theo % viewport).
    this.posX.set(10 + Math.random() * 75);
    this.posY.set(20 + Math.random() * 65);
  }

  protected async onCatch(): Promise<void> {
    if (this.catching()) {
      return;
    }
    this.catching.set(true);
    clearTimeout(this.hideTimer);
    clearInterval(this.hopTimer);

    try {
      const reward = await firstValueFrom(this.rewardApi.catchRat());
      this.visible.set(false);
      this.alreadyCaughtToday = true;
      this.snackBar.open(
        `🐀 Bạn đã bắt được con chuột trong bếp! Nhận ngay ưu đãi giảm ${reward.discountPercent}% cho đơn tiếp theo.`,
        'Tuyệt vời',
        { duration: 6000 },
      );
    } catch (err) {
      // 403 (đã bắt hôm nay, hiếm khi mở nhiều tab) hoặc lỗi mạng — ẩn lặng lẽ, không
      // làm phiền bằng thông báo lỗi cho 1 easter egg vui.
      this.visible.set(false);
      this.alreadyCaughtToday = err instanceof HttpErrorResponse && err.status === 403;
    } finally {
      this.catching.set(false);
      this.scheduleNextAppearance();
    }
  }
}
