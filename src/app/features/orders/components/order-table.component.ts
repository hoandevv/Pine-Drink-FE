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
              <span class="priority-dot" [ngClass]="(order.priority || 'NORMAL').toLowerCase()"></span>
              <span class="priority-label">{{ order.priority || 'NORMAL' }}</span>
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
      background: rgba(255,255,255,.92);
      border-radius: 24px;
      overflow: hidden;
      box-shadow:
        0 22px 60px rgba(15, 47, 28, .08),
        inset 0 1px 0 rgba(255,255,255,.9);
      border: 1px solid rgba(16, 32, 24, .08);
    }
    .saas-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      
      th {
        height: 44px;
        padding: 0 16px;
        background: linear-gradient(180deg, #fbfdfb, #f4f8f4);
        font-size: 10px;
        font-weight: 900;
        color: #66756a;
        text-transform: uppercase;
        letter-spacing: .065em;
        border-bottom: 1px solid rgba(16, 32, 24, .08);
      }
      
      td {
        height: 56px;
        padding: 0 16px;
        border-bottom: 1px solid rgba(16, 32, 24, .06);
        vertical-align: middle;
        font-size: 13px;
        color: #24342b;
      }

      tr:last-child td {
        border-bottom: 0;
      }
    }
    .order-row {
      cursor: pointer;
      transition: background .2s ease;
      &:hover {
        background: rgba(34, 197, 94, .035);
      }
    }
    .order-code {
      font-weight: 850;
      color: #14532d;
      letter-spacing: -0.02em;
    }
    .customer-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 180px;
      .avatar {
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        background: linear-gradient(145deg, #f8faf8, #eaf8ef);
        color: #14532d;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 12px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
      }
      .info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        .name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 800;
          font-size: 13px;
          color: #102018;
        }
        .phone {
          margin-top: 2px;
          font-size: 11px;
          color: #8a968e;
        }
      }
    }
    .items-summary {
      display: flex;
      flex-direction: column;
      min-width: 180px;
      .count {
        font-weight: 850;
        font-size: 13px;
        color: #102018;
      }
      .preview {
        margin-top: 3px;
        font-size: 11px;
        color: #8a968e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 220px;
      }
    }
    .total-amount {
      font-weight: 900;
      color: #102018;
      letter-spacing: -0.02em;
    }
    .priority-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: 1px;
      &.urgent { background: #ef4444; box-shadow: 0 0 0 4px rgba(239, 68, 68, .1); }
      &.high { background: #f59e0b; box-shadow: 0 0 0 4px rgba(245, 158, 11, .1); }
      &.normal { background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, .1); }
    }
    .priority-label {
      font-size: 11px;
      font-weight: 900;
      text-transform: capitalize;
      color: #647067;
    }
    .styled-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 5px;
      cursor: pointer;
      accent-color: #16a34a;
    }
    .btn-icon {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 12px;
      cursor: pointer;
      color: #8a968e;
      background: transparent;
      transition: all .2s ease;
      &:hover {
        background: rgba(16, 32, 24, .06);
        color: #102018;
      }
    }
  `]
})
export class OrderTableComponent {
  @Input() orders: Order[] = [];
  @Output() rowClick = new EventEmitter<Order>();
  @Output() actionClick = new EventEmitter<{order: Order, type: string}>();

  getItemsPreview(order: Order): string {
    return order.items.map((i: OrderItem) => i.name || i.productName || 'Item').join(', ');
  }
}
