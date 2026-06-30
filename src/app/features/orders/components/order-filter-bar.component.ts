import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-order-filter-bar',
  template: `
    <div class="filter-card">
      <form [formGroup]="filterForm" class="filter-content">
        <div class="search-group">
          <div class="search-input">
            <span class="material-symbols-outlined">search</span>
            <input type="text" formControlName="search" placeholder="Search order ID, customer, phone...">
          </div>
        </div>

        <div class="selectors-group">
          <select formControlName="status">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select formControlName="payment">
            <option value="">All Payment</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select formControlName="type">
            <option value="">All Types</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
            <option value="WALK_IN">Walk-in</option>
          </select>

          <select formControlName="dateRange">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="custom">Custom Range</option>
          </select>

          <button type="button" class="btn-clear" (click)="reset()">
            <span class="material-symbols-outlined">restart_alt</span>
            Clear
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .filter-card {
      background: white;
      padding: 16px 24px;
      border-radius: 20px;
      margin-bottom: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.02);
    }
    .filter-content {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    .search-group {
      flex: 1;
      min-width: 300px;
    }
    .search-input {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      padding: 0 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
      &:focus-within { border-color: var(--pine-primary); background: white; box-shadow: 0 0 0 3px rgba(15, 74, 42, 0.1); }
      
      input {
        border: none;
        background: transparent;
        padding: 12px 0;
        width: 100%;
        outline: none;
        font-weight: 500;
        color: var(--pine-dark);
        &::placeholder { color: #94a3b8; }
      }
      .material-symbols-outlined { color: #94a3b8; font-size: 20px; }
    }
    .selectors-group {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    select {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 10px 16px;
      border-radius: 12px;
      outline: none;
      font-weight: 600;
      color: var(--pine-dark);
      cursor: pointer;
      min-width: 130px;
      transition: all 0.2s;
      &:hover { border-color: #cbd5e1; }
      &:focus { border-color: var(--pine-primary); }
    }
    .btn-clear {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      color: #ef4444;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 10px;
      transition: all 0.2s;
      &:hover { background: #fef2f2; }
      .material-symbols-outlined { font-size: 18px; }
    }
  `]
})
export class OrderFilterBarComponent {
  filterForm: FormGroup;
  @Output() filterChange = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      payment: [''],
      type: [''],
      dateRange: ['today']
    });

    this.filterForm.valueChanges.subscribe((val: any) => this.filterChange.emit(val));
  }

  reset() {
    this.filterForm.reset({ dateRange: 'today', search: '', status: '', payment: '', type: '' });
  }
}

