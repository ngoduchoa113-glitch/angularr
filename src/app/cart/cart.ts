import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartStore } from '../stores/cart-store';
import { OrderStore } from '../stores/order-store';
import { RewardApiService } from '../services/reward-api.service';
import { MascotBus } from '../services/mascot-bus';
import { CartItemModel, RecipeCategory, RewardModel } from '../models';

const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  main: 'Món chính',
  dessert: 'Tráng miệng',
  drink: 'Đồ uống',
};

const BULK_DISCOUNT_MIN_SERVINGS = 5;

interface ItemTotal {
  item: CartItemModel;
  afterBulk: number;
  total: number;
  rewardApplied: boolean;
}

// US mới: "Đặt món" (recipe-detail) giờ chỉ thêm vào giỏ — trang này là nơi DUY NHẤT
// thật sự tạo Order (qua CartStore.checkout, tái dùng toàn bộ logic OrderService phía
// backend). Cho phép tick chọn nhiều món để mua cùng lúc, mỗi món vẫn tạo 1 Order riêng
// (đúng model hiện có: 1 Order = 1 recipe) — xem cart.service.ts phía backend.
@Component({
  selector: 'app-cart',
  imports: [RouterLink, DecimalPipe, MatButtonModule, MatIconModule, MatCardModule, MatCheckboxModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  protected readonly store = inject(CartStore);
  private readonly orderStore = inject(OrderStore);

  private readonly rewardApi = inject(RewardApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly mascotBus = inject(MascotBus);

  protected readonly categoryLabel = (c: RecipeCategory) => CATEGORY_LABELS[c];

  // Món nào đang được tick để mua trong đợt này — mặc định TẤT CẢ đều được chọn sẵn
  // khi tải giỏ hàng (đỡ phải tick từng cái nếu muốn mua hết), món mới thêm sau đó
  // cũng mặc định chọn; món bị bỏ chọn trước đó vẫn giữ nguyên trạng thái qua các lần
  // reload (vd sau khi đổi số phần 1 món khác).
  protected readonly selected = signal<Record<string, boolean>>({});

  protected readonly activeReward = signal<RewardModel | null>(null);
  protected readonly applyReward = signal(true);

  protected readonly checkingOut = signal(false);

  constructor() {
    effect(() => {
      const items = this.store.items();
      this.selected.update((prev) => {
        const next: Record<string, boolean> = {};
        for (const item of items) {
          next[item.id] = prev[item.id] ?? true;
        }
        return next;
      });
    });

    this.loadActiveReward();
  }

  private async loadActiveReward(): Promise<void> {
    try {
      const rewards = await firstValueFrom(this.rewardApi.getMine());
      this.activeReward.set(rewards[0] ?? null);
    } catch {
      // Không tải được ưu đãi thì thôi — không phá trải nghiệm xem giỏ hàng.
    }
  }

  protected readonly selectedItems = computed(() => this.store.items().filter((i) => this.selected()[i.id]));

  protected readonly allSelected = computed(() => {
    const items = this.store.items();
    return items.length > 0 && items.every((i) => this.selected()[i.id]);
  });

  // Tính tiền từng món y hệt công thức backend (order.service.ts#calculateTotalPrice):
  // giảm giá số lượng (≥5 phần) rồi tới reward (chỉ áp cho món giá trị cao nhất trong
  // các món đã chọn) — làm tròn từng món riêng rồi mới cộng lại, khớp chính xác số tiền
  // thật sự sẽ hiện trong "Đơn của tôi" sau khi xác nhận mua.
  protected readonly itemTotals = computed((): ItemTotal[] => {
    const items = this.selectedItems();
    const reward = this.applyReward() ? this.activeReward() : null;

    const rewardTargetId = reward
      ? items.reduce((maxItem, i) => (!maxItem || i.subtotal > maxItem.subtotal ? i : maxItem), null as CartItemModel | null)?.id
      : null;

    return items.map((item) => {
      const afterBulk = item.servings >= BULK_DISCOUNT_MIN_SERVINGS ? item.subtotal * 0.9 : item.subtotal;
      const rewardApplied = !!reward && item.id === rewardTargetId;
      const afterReward = rewardApplied ? afterBulk * (1 - reward.discountPercent / 100) : afterBulk;
      return { item, afterBulk, total: Math.round(afterReward), rewardApplied };
    });
  });

  protected readonly grandTotal = computed(() => this.itemTotals().reduce((sum, t) => sum + t.total, 0));

  protected toggleSelected(id: string): void {
    this.selected.update((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  protected toggleSelectAll(checked: boolean): void {
    const next: Record<string, boolean> = {};
    for (const item of this.store.items()) {
      next[item.id] = checked;
    }
    this.selected.set(next);
  }

  protected async changeServings(item: CartItemModel, delta: number): Promise<void> {
    const next = item.servings + delta;
    if (next < 1) {
      return;
    }
    try {
      await this.store.updateServings(item.id, next);
    } catch {
      this.snackBar.open('Không thể đổi số phần, thử lại sau', 'Đóng', { duration: 3000 });
    }
  }

  protected async removeItem(item: CartItemModel): Promise<void> {
    try {
      await this.store.removeItem(item.id);
    } catch {
      this.snackBar.open('Không thể xoá món khỏi giỏ, thử lại sau', 'Đóng', { duration: 3000 });
    }
  }

  protected async checkout(): Promise<void> {
    const ids = this.selectedItems().map((i) => i.id);
    if (ids.length === 0) {
      this.snackBar.open('Chọn ít nhất 1 món để xác nhận mua', 'Đóng', { duration: 3000 });
      return;
    }

    this.checkingOut.set(true);
    try {
      const rewardId = this.applyReward() ? (this.activeReward()?.id ?? undefined) : undefined;
      await this.store.checkout(ids, rewardId);
      // CartStore.checkout tạo Order ở backend nhưng OrderStore là 1 signal store
      // "root" riêng biệt, ordersResource của nó chỉ fetch lần đầu -> phải tự reload
      // ở đây thì trang "Đơn của tôi" mới thấy đơn vừa xác nhận mua.
      this.orderStore.ordersResource.reload();
      this.mascotBus.notifyOrderPlaced();
      this.snackBar.open(`Đã xác nhận mua ${ids.length} món thành công`, 'Đóng', { duration: 4000 });
      // Theo đúng yêu cầu: sau khi xác nhận, chuyển sang "Đơn của tôi" để xem tình trạng.
      await this.router.navigate(['/orders']);
    } catch (err) {
      const message = err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
        ? err.error.message
        : 'Xác nhận mua thất bại, thử lại sau';
      this.snackBar.open(message, 'Đóng', { duration: 4000 });
    } finally {
      this.checkingOut.set(false);
    }
  }
}
