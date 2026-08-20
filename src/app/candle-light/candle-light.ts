import { Component, ElementRef, OnDestroy, inject } from '@angular/core';

// Hiệu ứng "cầm nến đi trong bóng tối" — 1 overlay cố định phủ toàn viewport, sáng
// quanh vị trí con trỏ và tối dần ra ngoài, đi theo chuột. Chỉ cập nhật CSS custom
// property (--candle-x/y) trên background của 1 lớp overlay — không đụng layout/reflow
// của phần còn lại của trang, nên rất rẻ dù mousemove bắn liên tục.
@Component({
  selector: 'app-candle-light',
  templateUrl: './candle-light.html',
  styleUrl: './candle-light.css',
})
export class CandleLight implements OnDestroy {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private ticking = false;

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (this.ticking) {
      return;
    }
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      const style = this.hostEl.nativeElement.style;
      style.setProperty('--candle-x', `${e.clientX}px`);
      style.setProperty('--candle-y', `${e.clientY}px`);
    });
  };

  constructor() {
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}
