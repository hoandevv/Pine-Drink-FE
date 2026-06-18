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
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.02);
      display: flex;
      gap: 16px;
      transition: transform 0.2s;
      &:hover { transform: translateY(-4px); }
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      .material-symbols-outlined { font-size: 24px; }
    }
    .stat-content { flex: 1; }
    .stat-label { font-size: 13px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value-row { display: flex; align-items: baseline; gap: 8px; margin: 4px 0; }
    .stat-value { margin: 0; font-size: 24px; font-weight: 800; color: var(--pine-dark); }
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 700;
      &.up { color: #10b981; }
      &.down { color: #ef4444; }
      .material-symbols-outlined { font-size: 14px; }
    }
    .stat-progress {
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      margin-top: 8px;
      overflow: hidden;
      .progress-bar { height: 100%; background: currentColor; opacity: 0.3; }
    }

    /* Colors */
    .amber { .stat-icon { background: #fffbeb; color: #d97706; } .stat-progress { color: #d97706; } }
    .blue { .stat-icon { background: #eff6ff; color: #2563eb; } .stat-progress { color: #2563eb; } }
    .orange { .stat-icon { background: #fff7ed; color: #ea580c; } .stat-progress { color: #ea580c; } }
    .green { .stat-icon { background: #f0fdf4; color: #16a34a; } .stat-progress { color: #16a34a; } }
    .red { .stat-icon { background: #fef2f2; color: #dc2626; } .stat-progress { color: #dc2626; } }
    .pine { .stat-icon { background: var(--pine-white); color: var(--pine-primary); } .stat-progress { color: var(--pine-primary); } }
  `]
})
export class OrderStatsComponent {
  @Input() stats: OrderStat[] = [];
}

