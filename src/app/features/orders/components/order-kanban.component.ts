import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderStatus } from '../models/order.model';

@Component({
  selector: 'app-order-kanban',
  template: `
    <div class="kanban-board">
      <div *ngFor="let column of columns" class="kanban-column">
        <header class="column-header">
          <h3>{{ column.label }}</h3>
          <span class="count">{{ getOrdersByStatus(column.status).length }}</span>
        </header>
        
        <div class="column-content">
          <div *ngFor="let order of getOrdersByStatus(column.status)" 
               class="kanban-card" 
               [ngClass]="(order.priority || 'NORMAL').toLowerCase()"
               (click)="cardClick.emit(order)">
            <div class="card-header">
              <span class="order-code">#{{ order.orderCode }}</span>
              <span class="time">{{ order.createdAt }}</span>
            </div>
            
            <div class="customer-info">
              <span class="name">{{ order.customerName || 'Walk-in' }}</span>
              <span class="type-tag">{{ order.type }}</span>
            </div>

            <div class="items-preview">
              <span class="material-symbols-outlined">local_drink</span>
              {{ order.items.length }} items
            </div>

            <div class="card-footer">
              <app-payment-badge [status]="order.paymentStatus"></app-payment-badge>
              <div class="actions" (click)="$event.stopPropagation()">
                <button *ngIf="order.status === 'PENDING'" class="btn-next" (click)="statusChange.emit({order: order, status: 'CONFIRMED'})">
                  Confirm
                </button>
                <button *ngIf="order.status === 'CONFIRMED'" class="btn-next" (click)="statusChange.emit({order: order, status: 'PREPARING'})">
                  Start
                </button>
                <button *ngIf="order.status === 'PREPARING'" class="btn-next success" (click)="statusChange.emit({order: order, status: 'READY'})">
                  Ready
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kanban-board {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding-bottom: 20px;
      min-height: 600px;
      scrollbar-width: thin;
      &::-webkit-scrollbar { height: 6px; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    }
    .kanban-column {
      flex: 0 0 300px;
      background: #f8fafc;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 300px);
    }
    .column-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { margin: 0; font-size: 15px; font-weight: 800; color: var(--pine-dark); text-transform: uppercase; }
      .count { background: white; padding: 2px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #64748b; }
    }
    .column-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .kanban-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.01);
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid #e2e8f0;
      
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06); }
      &.urgent { border-left-color: #ef4444; }
      &.high { border-left-color: #f59e0b; }
      &.normal { border-left-color: #10b981; }
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      .order-code { font-weight: 800; color: var(--pine-primary); font-size: 14px; }
      .time { font-size: 12px; color: #94a3b8; }
    }
    .customer-info {
      margin-bottom: 12px;
      .name { display: block; font-weight: 700; color: var(--pine-dark); font-size: 14px; }
      .type-tag { font-size: 10px; font-weight: 800; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; text-transform: uppercase; margin-top: 4px; display: inline-block; }
    }
    .items-preview {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 16px;
      .material-symbols-outlined { font-size: 16px; }
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px dashed #f1f5f9;
    }
    .btn-next {
      background: var(--pine-primary);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      &:hover { background: var(--pine-primary-hover); }
      &.success { background: #10b981; &:hover { background: #059669; } }
    }
  `]
})
export class OrderKanbanComponent {
  @Input() orders: Order[] = [];
  @Output() cardClick = new EventEmitter<Order>();
  @Output() statusChange = new EventEmitter<{order: Order, status: OrderStatus}>();

  columns: { label: string; status: OrderStatus }[] = [
    { label: 'PENDING', status: 'PENDING' },
    { label: 'Confirmed', status: 'CONFIRMED' },
    { label: 'Preparing', status: 'PREPARING' },
    { label: 'Ready', status: 'READY' }
  ];

  getOrdersByStatus(status: OrderStatus): Order[] {
    return this.orders.filter(o => o.status === status);
  }
}

