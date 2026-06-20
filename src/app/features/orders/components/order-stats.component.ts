import { Component, Input } from '@angular/core';

export interface OrderStat {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'amber' | 'blue' | 'orange' | 'green' | 'red' | 'gray' | 'pine';
  trend: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-order-stats',
  template: `
    <div class="stats-grid">
      <div *ngFor="let stat of stats" class="stat-card" [ngClass]="stat.color">
        <div class="stat-icon">
          <span class="material-symbols-outlined">{{ stat.icon }}</span>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ stat.label }}</span>
          <div class="stat-value-row">
            <h2 class="stat-value">{{ stat.value }}</h2>
            <div class="stat-trend" [ngClass]="stat.trend">
              <span class="material-symbols-outlined">{{ stat.trend === 'up' ? 'trending_up' : 'trending_down' }}</span>
              <span>{{ stat.change }}%</span>
            </div>
          </div>
          <div class="stat-progress">
            <div class="progress-bar" [style.width.%]="70"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    .stat-card {
      position: relative;
      overflow: hidden;
      padding: 16px;
      border-radius: 20px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.94), rgba(255,255,255,.78));
      border: 1px solid rgba(16, 32, 24, .08);
      box-shadow:
        0 14px 36px rgba(15, 47, 28, .07),
        inset 0 1px 0 rgba(255,255,255,.9);
      backdrop-filter: blur(16px);
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      &:hover {
        transform: translateY(-2px);
        border-color: rgba(22, 163, 74, .18);
        box-shadow:
          0 20px 48px rgba(15, 47, 28, .1),
          inset 0 1px 0 rgba(255,255,255,.95);
      }
      &::before {
        content: "";
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(90deg, #22c55e, #f59e0b);
        opacity: .75;
      }
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
      .material-symbols-outlined { font-size: 22px; }
    }
    .stat-content { flex: 1; }
    .stat-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 11px;
      color: #647067;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .stat-value-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin: 0;
    }
    .stat-value {
      margin: 0;
      font-size: 28px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.045em;
      color: #102018;
    }
    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      min-height: 26px;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      background: rgba(16, 32, 24, .06);
      &.up {
        color: #15803d;
        background: rgba(34, 197, 94, .1);
      }
      &.down {
        color: #b91c1c;
        background: rgba(220, 38, 38, .1);
      }
      .material-symbols-outlined { font-size: 14px; }
    }
    .stat-progress {
      position: relative;
      height: 5px;
      margin-top: 14px;
      background: #eef4ef;
      border-radius: 999px;
      overflow: hidden;
      .progress-bar {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, currentColor, rgba(22,163,74,.75));
      }
    }

    /* Colors */
    .amber { color: #b45309; .stat-icon { background: #fffbeb; color: #d97706; } }
    .blue { color: #1d4ed8; .stat-icon { background: #eff6ff; color: #2563eb; } }
    .orange { color: #c2410c; .stat-icon { background: #fff7ed; color: #ea580c; } }
    .green { color: #15803d; .stat-icon { background: #f0fdf4; color: #16a34a; } }
    .red { color: #b91c1c; .stat-icon { background: #fef2f2; color: #dc2626; } }
    .pine { color: #14532d; .stat-icon { background: #f8faf8; color: #16a34a; } }
    .gray { color: #647067; .stat-icon { background: #f1f5f1; color: #647067; } }
  `]
})
export class OrderStatsComponent {
  @Input() stats: OrderStat[] = [];
}
