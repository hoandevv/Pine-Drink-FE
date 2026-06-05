import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderItem } from '../models/order.model';

@Component({
  selector: 'app-order-table',
  template: `
    <div class="table-container">
      <table class="saas-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" class="styled-checkbox">
            </th>
            <th class="col-id">Order ID</th>
            <th class="col-time">Time</th>
            <th class="col-customer">Customer</th>
            <th class="col-items">Items Summary</th>
            <th class="col-total">Total</th>
            <th class="col-payment">Payment</th>
            <th class="col-status">Status</th>
            <th class="col-priority">Priority</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of orders" (click)="rowClick.emit(order)" class="order-row">
            <td>
              <input type="checkbox" class="styled-checkbox" (click)="$event.stopPropagation()">
            </td>
            <td>
              <span class="order-code">#{{ order.orderCode }}</span>
            </td>
            <td>
              <div class="time-cell">
                <span class="date">{{ order.createdAt }}</span>
              </div>
            </td>
            <td>
              <div class="customer-cell">
                <div class="avatar">{{ (order.customerName || 'W')[0] }}</div>
                <div class="info">
                  <span class="name">{{ order.customerName || 'Walk-in' }}</span>
                  <span class="phone">{{ order.customerPhone || 'N/A' }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="items-summary">
                <span class="count">{{ order.items.length }} items</span>
                <span class="preview">{{ getItemsPreview(order) }}</span>
              </div>
            </td>
            <td>
              <span class="total-amount">{{ order.totalAmount | number }} đ</span>
            </td>
            <td>
              <app-payment-badge [status]="order.paymentStatus"></app-payment-badge>
            </td>
            <td>
              <app-order-status-badge [status]="order.status"></app-order-status-badge>
            </td>
            <td>
              <span class="priority-dot" [ngClass]="order.priority.toLowerCase()"></span>
              <span class="priority-label">{{ order.priority }}</span>
            </td>
            <td class="col-actions">
              <button class="btn-icon" (click)="$event.stopPropagation(); actionClick.emit({order: order, type: 'more'})">
                <span class="material-symbols-outlined">more_vert</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.02);
    }
    .saas-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      
      th {
        background: #f8fafc;
        padding: 16px;
        font-size: 12px;
        font-weight: 800;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #f1f5f9;
      }
      
      td {
        padding: 16px;
        border-bottom: 1px solid #f8fafc;
        vertical-align: middle;
        font-size: 14px;
        color: var(--pine-dark);
      }
    }
    .order-row {
      cursor: pointer;
      transition: background 0.2s;
      &:hover { background: #f8fafc; }
    }
    .order-code { font-weight: 800; color: var(--pine-primary); }
    .customer-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      .avatar {
        width: 32px;
        height: 32px;
        background: var(--pine-cream);
        color: var(--pine-primary);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 12px;
      }
      .info {
        display: flex;
        flex-direction: column;
        .name { font-weight: 700; font-size: 14px; }
        .phone { font-size: 12px; color: #94a3b8; }
      }
    }
    .items-summary {
      display: flex;
      flex-direction: column;
      .count { font-weight: 700; font-size: 13px; }
      .preview { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    }
    .total-amount { font-weight: 800; color: var(--pine-dark); }
    .priority-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      &.urgent { background: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
      &.high { background: #f59e0b; }
      &.normal { background: #10b981; }
    }
    .priority-label { font-size: 12px; font-weight: 700; text-transform: capitalize; }
    .styled-checkbox { width: 18px; height: 18px; border-radius: 6px; cursor: pointer; }
    .btn-icon { background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 6px; &:hover { background: #f1f5f9; color: var(--pine-dark); } }
  `]
})
export class OrderTableComponent {
  @Input() orders: Order[] = [];
  @Output() rowClick = new EventEmitter<Order>();
  @Output() actionClick = new EventEmitter<{order: Order, type: string}>();

  getItemsPreview(order: Order): string {
    return order.items.map((i: OrderItem) => i.name).join(', ');
  }
}
