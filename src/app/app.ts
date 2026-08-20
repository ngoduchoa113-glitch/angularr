import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, map, startWith } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthStore } from './stores/auth-store';
import { NotificationStore } from './stores/notification-store';
import { CartStore } from './stores/cart-store';
import { OrderStatus } from './models';
import { CatMascot } from './cat-mascot/cat-mascot';
import { CandleLight } from './candle-light/candle-light';
import { KitchenRat } from './kitchen-rat/kitchen-rat';

// Dưới ngưỡng này, drawer trượt đè lên nội dung (mode="over") thay vì nằm cố định bên cạnh.
const WIDE_SCREEN_QUERY = '(min-width: 840px)';

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Bị huỷ',
};

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    CatMascot,
    CandleLight,
    KitchenRat,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('My Recipe Box');

  protected readonly authStore = inject(AuthStore);

  protected readonly cartStore = inject(CartStore);

  private readonly notificationStore = inject(NotificationStore);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isWideScreen = toSignal(
    this.breakpointObserver.observe(WIDE_SCREEN_QUERY).pipe(map((state) => state.matches)),
    { initialValue: true },
  );

  protected readonly sidenavMode = computed(() => (this.isWideScreen() ? 'side' : 'over'));

  // Mặc định mở/đóng theo kích thước màn hình, nhưng vẫn cho người dùng tự bật/tắt bằng nút ☰.
  protected readonly sidenavOpened = signal(true);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // Chưa đăng nhập/đăng ký thì chưa dùng được menu — ẩn hẳn cho đỡ rối.
  protected readonly showSidenav = computed(() => !this.currentUrl().startsWith('/auth'));

  constructor() {
    effect(() => {
      this.sidenavOpened.set(this.isWideScreen());
    });

    // BE-18: mở kết nối SSE khi đăng nhập, đóng khi đăng xuất — sống ở app root vì
    // component này tồn tại xuyên suốt mọi trang, không phụ thuộc route hiện tại.
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.notificationStore.connect();
      } else {
        this.notificationStore.disconnect();
      }
    });

    effect(() => {
      const event = this.notificationStore.lastEvent();
      if (!event) {
        return;
      }

      if (event.type === 'order-created') {
        if (this.authStore.isAdmin()) {
          this.snackBar.open(`Đơn mới từ ${event.order.userEmail}: ${event.order.recipeName}`, 'Đóng', { duration: 5000 });
        }
      } else {
        const statusLabel = ORDER_STATUS_LABEL[event.order.status];
        this.snackBar.open(`Đơn "${event.order.recipeName}" đã chuyển sang ${statusLabel}`, 'Đóng', { duration: 5000 });
      }
    });
  }

  protected logout(): void {
    this.authStore.logout();
    this.router.navigate(['/auth']);
  }
}
