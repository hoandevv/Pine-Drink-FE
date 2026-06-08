import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderStatus } from '../models/order.model';

@Component({
  selector: 'app-order-detail-drawer',
  template: `
    <div class="drawer-overlay" [class.open]="isOpen" (click)="close.emit()">
      <div class="drawer-content" [class.open]="isOpen" (click)="$event.stopPropagation()">
        <header class="drawer-header">
          <div class="header-main">
            <div class="title-area">
              <h2>Order #{{ order?.orderCode }}</h2>
              <span class="time">Created at {{ order?.createdAt }}</span>
            </div>
            <button class="btn-close" (click)="close.emit()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="status-row" *ngIf="order">
            <app-order-status-badge [status]="order.status"></app-order-status-badge>
            <app-payment-badge [status]="order.paymentStatus"></app-payment-badge>
            <span class="type-tag">{{ order.type }}</span>
          </div>
        </header>

        <div class="drawer-body" *ngIf="order">
          <!-- Customer Info -->
          <section class="info-section">
            <h3>Customer Info</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Name</span>
                <span class="value">{{ order.customerName || 'Walk-in' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Phone</span>
                <span class="value">{{ order.customerPhone || 'N/A' }}</span>
              </div>
              <div class="info-item full">
                <span class="label">Address</span>
                <span class="value">{{ order.customerAddress || 'N/A' }}</span>
              </div>
            </div>
          </section>

          <!-- Items -->
          <section class="info-section">
            <h3>Order Items ({{ order.items.length }})</h3>
            <div class="items-list">
              <div *ngFor="let item of order.items" class="order-item">
                <div class="item-img">
                  <span class="material-symbols-outlined">local_drink</span>
                </div>
                <div class="item-details">
                  <div class="item-name-row">
                    <span class="name">{{ item.name }}</span>
                    <span class="price">{{ item.totalPrice | number }} đ</span>
                  </div>
                  <div class="item-meta">
                    <span class="variant">{{ item.size }} · {{ item.variant }}</span>
                    <div class="toppings" *ngIf="item.toppings.length">
                      + <ng-container *ngFor="let t of item.toppings; let last = last">
                        {{ t.name }}{{ !last ? ', ' : '' }}
                      </ng-container>
                    </div>
                  </div>
                  <div class="item-qty">Qty: {{ item.quantity }}</div>
                </div>
              </div>
            </div>
            
            <div class="payment-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ order.subtotal | number }} đ</span>
              </div>
              <div class="summary-row">
                <span>Discount</span>
                <span class="discount">-{{ order.discount | number }} đ</span>
              </div>
              <div class="summary-row grand-total">
                <span>Total Amount</span>
                <span>{{ order.totalAmount | number }} đ</span>
              </div>
            </div>
          </section>

          <!-- Timeline -->
          <section class="info-section">
            <h3>History Timeline</h3>
            <div class="timeline">
              <div *ngFor="let step of order.timeline" class="timeline-item">
                <div class="dot"></div>
                <div class="content">
                  <span class="status">{{ step.status }}</span>
                  <span class="time">{{ step.time }}</span>
                  <p class="note" *ngIf="step.note">{{ step.note }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer class="drawer-footer" *ngIf="order">
          <button class="btn-secondary danger" (click)="statusChange.emit({order: order, status: 'CANCELLED'})">
            Cancel Order
          </button>
          <div class="main-actions">
            <button class="btn-secondary">
              <span class="material-symbols-outlined">print</span>
              Print
            </button>
            <button *ngIf="order.status === 'NEW'" class="btn-primary" (click)="statusChange.emit({order: order, status: 'CONFIRMED'})">
              Confirm Order
            </button>
            <button *ngIf="order.status === 'CONFIRMED'" class="btn-primary" (click)="statusChange.emit({order: order, status: 'PREPARING'})">
              Start Preparing
            </button>
            <button *ngIf="order.status === 'PREPARING'" class="btn-primary success" (click)="statusChange.emit({order: order, status: 'READY'})">
              Mark as Ready
            </button>
            <button *ngIf="order.status === 'READY'" class="btn-primary success" (click)="statusChange.emit({order: order, status: 'COMPLETED'})">
              Complete Order
            </button>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      &.open { opacity: 1; visibility: visible; }
    }
    .drawer-content {
      position: fixed;
      top: 0;
      right: -520px;
      width: 520px;
      height: 100vh;
      background: white;
      box-shadow: -10px 0 40px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &.open { right: 0; }
    }
    .drawer-header {
      padding: 24px;
      border-bottom: 1px solid #f1f5f9;
      .header-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
      h2 { margin: 0; font-size: 20px; font-weight: 800; color: var(--pine-dark); }
      .time { font-size: 13px; color: #94a3b8; }
      .status-row { display: flex; gap: 8px; align-items: center; }
      .type-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #64748b; }
    }
    .drawer-body { flex: 1; overflow-y: auto; padding: 24px; }
    .info-section {
      margin-bottom: 32px;
      h3 { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 16px;
      .info-item { display: flex; flex-direction: column; gap: 4px; &.full { grid-column: 1 / -1; } }
      .label { font-size: 12px; color: #64748b; font-weight: 600; }
      .value { font-size: 14px; font-weight: 700; color: var(--pine-dark); }
    }
    .items-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .order-item {
      display: flex;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
      .item-img { width: 48px; height: 48px; background: var(--pine-white); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--pine-primary); }
      .item-details { flex: 1; }
      .item-name-row { display: flex; justify-content: space-between; margin-bottom: 4px; .name { font-weight: 700; color: var(--pine-dark); } .price { font-weight: 800; color: var(--pine-primary); } }
      .item-meta { font-size: 12px; color: #64748b; .toppings { color: #94a3b8; margin-top: 2px; } }
      .item-qty { font-size: 12px; font-weight: 700; color: #94a3b8; margin-top: 4px; }
    }
    .payment-summary {
      background: #f8fafc;
      padding: 16px;
      border-radius: 16px;
      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #64748b;
        &.grand-total { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 18px; font-weight: 800; color: var(--pine-primary); }
        .discount { color: #ef4444; }
      }
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-left: 8px;
      .timeline-item {
        position: relative;
        padding-left: 24px;
        border-left: 2px solid #f1f5f9;
        &:last-child { border-left-color: transparent; }
        .dot { position: absolute; left: -7px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #e2e8f0; border: 2px solid white; }
        .content { display: flex; flex-direction: column; .status { font-weight: 800; font-size: 13px; color: var(--pine-dark); } .time { font-size: 12px; color: #94a3b8; } .note { font-size: 12px; margin-top: 4px; color: #64748b; } }
        &:first-child .dot { background: var(--pine-primary); box-shadow: 0 0 0 4px rgba(15, 74, 42, 0.1); }
      }
    }
    .drawer-footer {
      padding: 24px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 12px;
      .main-actions { display: flex; gap: 12px; }
      button { flex: 1; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .btn-primary { background: var(--pine-primary); color: white; &:hover { background: var(--pine-primary-hover); } &.success { background: #10b981; &:hover { background: #059669; } } }
      .btn-secondary { background: #f1f5f9; color: #64748b; &:hover { background: #e2e8f0; color: var(--pine-dark); } &.danger { color: #ef4444; &:hover { background: #fee2e2; } } }
    }
    .btn-close { background: #f8fafc; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; &:hover { background: #f1f5f9; color: var(--pine-dark); } }
  `]
})
export class OrderDetailDrawerComponent {
  @Input() order: Order | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<{order: Order, status: OrderStatus}>();
}
