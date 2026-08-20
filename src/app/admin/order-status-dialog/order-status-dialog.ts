import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OrderStatus } from '../../models';

export interface OrderStatusDialogData {
  recipeName: string;
  currentStatus: OrderStatus;
}

export interface OrderStatusDialogResult {
  status: OrderStatus;
  cancelReason?: string;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'in_progress', label: 'Đang làm' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Bị huỷ' },
];

@Component({
  selector: 'app-order-status-dialog',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './order-status-dialog.html',
  styleUrl: './order-status-dialog.css',
})
export class OrderStatusDialog {
  protected readonly data = inject<OrderStatusDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OrderStatusDialog, OrderStatusDialogResult>);

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly status = signal<OrderStatus>(this.data.currentStatus);
  protected readonly cancelReason = signal('');

  // AD-03: bắt buộc nhập lý do khi chọn "Bị huỷ".
  protected readonly reasonMissing = computed(() => this.status() === 'cancelled' && !this.cancelReason().trim());

  protected setStatus(value: OrderStatus): void {
    this.status.set(value);
  }

  protected confirm(): void {
    if (this.reasonMissing()) {
      return;
    }
    this.dialogRef.close({
      status: this.status(),
      cancelReason: this.status() === 'cancelled' ? this.cancelReason().trim() : undefined,
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
