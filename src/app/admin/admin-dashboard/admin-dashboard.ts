import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { OrderStats } from '../../models';
import { API_BASE_URL } from '../../api-base-url';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const STATS_URL = `${API_BASE_URL}/admin/orders/stats`;

// Donut: 3 slot đầu của bảng màu categorical (đã chạy validate_palette.js all-pairs,
// pass CVD cho cả light/dark) — KHÔNG dùng cặp status good/critical (đỏ/xanh lá) vì
// đó là cặp mù màu đỏ-xanh kinh điển, fail CVD ΔE 4.1 (dưới cả ngưỡng sàn 6).
const STATUS_COLOR_VAR: Record<string, string> = {
  in_progress: '--chart-series-1',
  completed: '--chart-series-3',
  cancelled: '--chart-series-2',
};
const STATUS_LABEL: Record<string, string> = {
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Bị huỷ',
};

interface DonutSegment {
  status: string;
  label: string;
  count: number;
  percent: number;
  colorVar: string;
  dashArray: string;
  dashOffset: number;
}

const DONUT_RADIUS = 60;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_GAP_DEGREES = 3; // khoảng hở 2px quy đổi ra góc giữa các segment

interface LinePoint {
  date: string;
  revenue: number;
  x: number;
  y: number;
}

const LINE_WIDTH = 560;
const LINE_HEIGHT = 160;
const LINE_PADDING = 8;
// Chừa thêm khoảng trống phía trên đường line để nhãn giá trị cuối (vd đỉnh doanh
// thu) không bị tràn ra ngoài viewBox khi điểm cao nhất nằm sát mép trên.
const LINE_TOP_PADDING = 24;

@Component({
  selector: 'app-admin-dashboard',
  imports: [DecimalPipe, DatePipe, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {

  protected readonly statsResource = httpResource<OrderStats>(() => STATS_URL);

  protected readonly hoveredPointIndex = signal<number | null>(null);
  protected readonly hoveredBarIndex = signal<number | null>(null);

  protected readonly donutSegments = computed<DonutSegment[]>(() => {
    const stats = this.statsResource.value();
    if (!stats) {
      return [];
    }

    const total = stats.totalOrders || 1;
    const order: (keyof typeof STATUS_LABEL)[] = ['in_progress', 'completed', 'cancelled'];
    const gapLength = (DONUT_GAP_DEGREES / 360) * DONUT_CIRCUMFERENCE;

    let offset = 0;
    return order.map((status) => {
      const count = stats.statusBreakdown[status as keyof OrderStats['statusBreakdown']] ?? 0;
      const percent = Math.round((count / total) * 100);
      const rawLength = (count / total) * DONUT_CIRCUMFERENCE;
      const segmentLength = Math.max(rawLength - gapLength, 0);

      const segment: DonutSegment = {
        status,
        label: STATUS_LABEL[status],
        count,
        percent,
        colorVar: STATUS_COLOR_VAR[status],
        dashArray: `${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`,
        dashOffset: -offset,
      };

      offset += rawLength;
      return segment;
    });
  });

  protected readonly linePoints = computed<LinePoint[]>(() => {
    const stats = this.statsResource.value();
    if (!stats || stats.revenueByDay.length === 0) {
      return [];
    }

    const values = stats.revenueByDay.map((d) => d.revenue);
    const maxValue = Math.max(...values, 1);
    const stepX = (LINE_WIDTH - LINE_PADDING * 2) / (stats.revenueByDay.length - 1 || 1);

    const plotHeight = LINE_HEIGHT - LINE_TOP_PADDING - LINE_PADDING;
    return stats.revenueByDay.map((d, i) => ({
      date: d.date,
      revenue: d.revenue,
      x: LINE_PADDING + i * stepX,
      y: LINE_TOP_PADDING + (1 - d.revenue / maxValue) * plotHeight,
    }));
  });

  protected readonly linePath = computed(() => {
    const points = this.linePoints();
    if (points.length === 0) {
      return '';
    }
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  protected readonly maxTopRecipeCount = computed(() => {
    const stats = this.statsResource.value();
    if (!stats || stats.topRecipes.length === 0) {
      return 1;
    }
    return Math.max(...stats.topRecipes.map((r) => r.orderCount));
  });

  protected readonly lineWidth = LINE_WIDTH;
  protected readonly lineHeight = LINE_HEIGHT;
  protected readonly donutRadius = DONUT_RADIUS;
  protected readonly donutCircumference = DONUT_CIRCUMFERENCE;

  protected onLineHover(event: MouseEvent, svgEl: SVGSVGElement): void {
    const points = this.linePoints();
    if (points.length === 0) {
      return;
    }

    const rect = svgEl.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * LINE_WIDTH;

    let nearestIndex = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    });
    this.hoveredPointIndex.set(nearestIndex);
  }

  protected onLineLeave(): void {
    this.hoveredPointIndex.set(null);
  }

}
