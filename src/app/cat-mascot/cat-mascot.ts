import { Component, ElementRef, OnDestroy, effect, inject, signal } from '@angular/core';
import { MascotBus } from '../services/mascot-bus';

const IDLE_TO_SLEEP_MS = 15_000;
const BLINK_MIN_MS = 3_000;
const BLINK_MAX_MS = 6_000;
const BLINK_DURATION_MS = 150;
const MEOW_DURATION_MS = 1_500;
const HAPPY_DURATION_MS = 1_200;
const RUNNING_DURATION_MS = 1_800;
const MAX_PUPIL_OFFSET = 2.2; // px — mắt chỉ đảo nhẹ trong hốc mắt, không lệch quá xa

// Linh vật của app — 1 instance sống xuyên suốt (đặt trong app.html, không theo route),
// tự quản lý trạng thái qua timer nội bộ (ngủ khi rảnh, chớp mắt ngẫu nhiên) + lắng nghe
// MascotBus cho các phản ứng do nghiệp vụ khác kích hoạt (yêu thích, đặt món thành công).
@Component({
  selector: 'app-cat-mascot',
  templateUrl: './cat-mascot.html',
  styleUrl: './cat-mascot.css',
})
export class CatMascot implements OnDestroy {
  private readonly bus = inject(MascotBus);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  protected readonly sleeping = signal(false);
  protected readonly blinking = signal(false);
  protected readonly showMeow = signal(false);
  protected readonly happy = signal(false);
  protected readonly running = signal(false);

  protected readonly pupilX = signal(0);
  protected readonly pupilY = signal(0);

  private idleTimer?: ReturnType<typeof setTimeout>;
  private blinkTimer?: ReturnType<typeof setTimeout>;
  private meowTimer?: ReturnType<typeof setTimeout>;
  private happyTimer?: ReturnType<typeof setTimeout>;
  private runningTimer?: ReturnType<typeof setTimeout>;
  private mouseMoveTicking = false;

  private readonly onWindowMouseMove = (e: MouseEvent): void => {
    this.resetIdleTimer();

    if (this.mouseMoveTicking) {
      return;
    }
    this.mouseMoveTicking = true;
    requestAnimationFrame(() => {
      this.mouseMoveTicking = false;
      this.trackCursor(e.clientX, e.clientY);
    });
  };

  private readonly onWindowActivity = (): void => this.resetIdleTimer();

  constructor() {
    window.addEventListener('mousemove', this.onWindowMouseMove, { passive: true });
    window.addEventListener('keydown', this.onWindowActivity);
    window.addEventListener('click', this.onWindowActivity);
    window.addEventListener('scroll', this.onWindowActivity, { passive: true, capture: true });

    this.resetIdleTimer();
    this.scheduleNextBlink();

    // Bỏ qua lần chạy đầu tiên của effect (giá trị khởi tạo 0 của signal) — chỉ phản
    // ứng khi MascotBus thực sự bắn tín hiệu mới (xem MascotBus).
    effect(() => {
      const pulse = this.bus.favoritedPulse();
      if (pulse === 0) {
        return;
      }
      this.playHappy();
    });

    effect(() => {
      const pulse = this.bus.orderPlacedPulse();
      if (pulse === 0) {
        return;
      }
      this.playRunning();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('keydown', this.onWindowActivity);
    window.removeEventListener('click', this.onWindowActivity);
    window.removeEventListener('scroll', this.onWindowActivity, true);
    clearTimeout(this.idleTimer);
    clearTimeout(this.blinkTimer);
    clearTimeout(this.meowTimer);
    clearTimeout(this.happyTimer);
    clearTimeout(this.runningTimer);
  }

  protected onCatClick(): void {
    if (this.sleeping()) {
      // Đánh thức thay vì kêu — click lúc đang ngủ nên ưu tiên cảm giác "đánh thức nó dậy".
      this.resetIdleTimer();
      return;
    }

    this.showMeow.set(true);
    clearTimeout(this.meowTimer);
    this.meowTimer = setTimeout(() => this.showMeow.set(false), MEOW_DURATION_MS);
  }

  private trackCursor(clientX: number, clientY: number): void {
    if (this.sleeping()) {
      return;
    }

    const rect = this.hostEl.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX);

    this.pupilX.set(Math.cos(angle) * MAX_PUPIL_OFFSET);
    this.pupilY.set(Math.sin(angle) * MAX_PUPIL_OFFSET);
  }

  private resetIdleTimer(): void {
    this.sleeping.set(false);
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.sleeping.set(true), IDLE_TO_SLEEP_MS);
  }

  private scheduleNextBlink(): void {
    const delay = BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
    this.blinkTimer = setTimeout(() => {
      if (!this.sleeping()) {
        this.blinking.set(true);
        setTimeout(() => this.blinking.set(false), BLINK_DURATION_MS);
      }
      this.scheduleNextBlink();
    }, delay);
  }

  private playHappy(): void {
    this.happy.set(true);
    clearTimeout(this.happyTimer);
    this.happyTimer = setTimeout(() => this.happy.set(false), HAPPY_DURATION_MS);
  }

  private playRunning(): void {
    this.running.set(true);
    clearTimeout(this.runningTimer);
    this.runningTimer = setTimeout(() => this.running.set(false), RUNNING_DURATION_MS);
  }
}
