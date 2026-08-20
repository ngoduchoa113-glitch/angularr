import { Component, effect, inject, signal } from '@angular/core';
import { httpResource, HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AdminOrderApiService } from '../../services/admin-order-api.service';
import { NotificationStore } from '../../stores/notification-store';
import { OrderModel, OrderStatus } from '../../models';
import { OrderStatusDialog, OrderStatusDialogData, OrderStatusDialogResult } from '../order-status-dialog/order-status-dialog';
import { API_BASE_URL } from '../../api-base-url';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const STATUS_LABEL: Record<OrderStatus, string> = {
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Bị huỷ',
};

const STATUS_FILTERS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: 'Tất cả' },
  { value: 'in_progress', label: 'Đang làm' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Bị huỷ' },
];

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }
  return fallback;
}

@Component({
  selector: 'app-admin-orders',
  imports: [DecimalPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders {

  private readonly adminOrderApi = inject(AdminOrderApiService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    // BE-18: đơn mới hoặc đổi trạng thái -> tự cập nhật danh sách quản trị.
    effect(() => {
      const event = this.notificationStore.lastEvent();
      if (event?.type === 'order-created' || event?.type === 'order-status-changed') {
        this.ordersResource.reload();
      }
    });
  }

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly activeFilter = signal<OrderStatus | null>(null);

  protected readonly ordersResource = httpResource<OrderModel[]>(() => {
    const status = this.activeFilter();
    const url = `${API_BASE_URL}/admin/orders`;
    return status ? `${url}?status=${status}` : url;
  }, { defaultValue: [] });

  protected readonly updatingOrderId = signal<string | null>(null);

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABEL[status];
  }

  protected setFilter(status: OrderStatus | null): void {
    this.activeFilter.set(status);
  }

  protected openStatusDialog(order: OrderModel): void {
    const dialogRef = this.dialog.open<OrderStatusDialog, OrderStatusDialogData, OrderStatusDialogResult>(OrderStatusDialog, {
      data: { recipeName: order.recipeName, currentStatus: order.status },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      this.updatingOrderId.set(order.id);
      try {
        await firstValueFrom(this.adminOrderApi.updateStatus(order.id, result.status, result.cancelReason));
        this.ordersResource.reload();
        this.snackBar.open('Đã cập nhật trạng thái đơn', 'Đóng', { duration: 3000 });
      } catch (err) {
        this.snackBar.open(resolveErrorMessage(err, 'Không thể cập nhật trạng thái'), 'Đóng', { duration: 4000 });
      } finally {
        this.updatingOrderId.set(null);
      }
    });
  }

}
