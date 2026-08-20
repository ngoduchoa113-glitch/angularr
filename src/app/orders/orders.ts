import { Component, effect, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { OrderStore } from '../stores/order-store';
import { NotificationStore } from '../stores/notification-store';
import { OrderModel } from '../models';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const STATUS_LABEL: Record<OrderModel['status'], string> = {
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Bị huỷ',
};

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }
  return fallback;
}

@Component({
  selector: 'app-orders',
  imports: [DecimalPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {

  protected readonly store = inject(OrderStore);
  private readonly notificationStore = inject(NotificationStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    // BE-18: đơn của mình đổi trạng thái (do admin xử lý) -> tự cập nhật danh sách,
    // không cần user tự bấm F5. Toast hiển thị chung ở app.ts.
    effect(() => {
      if (this.notificationStore.lastEvent()?.type === 'order-status-changed') {
        this.store.ordersResource.reload();
      }
    });
  }

  protected statusLabel(status: OrderModel['status']): string {
    return STATUS_LABEL[status];
  }

  // --- Sửa số phần (US-09) ---
  protected readonly editingOrderId = signal<string | null>(null);
  protected readonly editServings = signal(1);
  protected readonly savingEdit = signal(false);

  protected startEdit(order: OrderModel): void {
    this.editingOrderId.set(order.id);
    this.editServings.set(order.servings);
  }

  protected cancelEdit(): void {
    this.editingOrderId.set(null);
  }

  protected increaseEditServings(): void {
    this.editServings.update((n) => n + 1);
  }

  protected decreaseEditServings(): void {
    if (this.editServings() <= 1) {
      return;
    }
    this.editServings.update((n) => n - 1);
  }

  protected async saveEdit(order: OrderModel): Promise<void> {
    this.savingEdit.set(true);
    try {
      await this.store.updateOrder(order.id, this.editServings());
      this.editingOrderId.set(null);
      this.snackBar.open('Đã cập nhật đơn', 'Đóng', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(resolveErrorMessage(err, 'Không thể cập nhật đơn'), 'Đóng', { duration: 4000 });
    } finally {
      this.savingEdit.set(false);
    }
  }

  // --- Huỷ đơn (US-10, FE-13: cần confirmation dialog) ---
  protected readonly cancellingOrderId = signal<string | null>(null);

  protected confirmCancelOrder(order: OrderModel): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Huỷ đơn?',
        message: `Bạn có chắc muốn huỷ đơn "${order.recipeName}"? Hành động này không thể hoàn tác.`,
        confirmText: 'Huỷ đơn',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.cancellingOrderId.set(order.id);
      try {
        await this.store.cancelOrder(order.id);
        this.snackBar.open('Đã huỷ đơn', 'Đóng', { duration: 3000 });
      } catch (err) {
        this.snackBar.open(resolveErrorMessage(err, 'Không thể huỷ đơn'), 'Đóng', { duration: 4000 });
      } finally {
        this.cancellingOrderId.set(null);
      }
    });
  }

}
