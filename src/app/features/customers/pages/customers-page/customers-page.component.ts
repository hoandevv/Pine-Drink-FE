import { Component } from '@angular/core';

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'New';
  orders: number;
  spent: number;
  lastOrder: string;
  status: 'Active' | 'VIP' | 'At risk';
}

@Component({
  selector: 'app-customers-page',
  templateUrl: './customers-page.component.html',
  styleUrls: ['./customers-page.component.scss']
})
export class CustomersPageComponent {
  searchTerm = '';
  selectedTier = 'All';

  readonly tiers = ['All', 'Diamond', 'Gold', 'Silver', 'New'];

  readonly customers: CustomerSummary[] = [
    { id: 'CUS-2401', name: 'Nguyễn Hoàng An', email: 'an.nguyen@email.vn', phone: '0901 222 345', tier: 'Diamond', orders: 42, spent: 12800000, lastOrder: 'Hôm nay', status: 'VIP' },
    { id: 'CUS-2402', name: 'Trần Minh Tú', email: 'tu.tran@email.vn', phone: '0918 445 102', tier: 'Gold', orders: 25, spent: 7400000, lastOrder: '2 giờ trước', status: 'Active' },
    { id: 'CUS-2403', name: 'Lê Khánh Vy', email: 'vy.le@email.vn', phone: '0933 120 777', tier: 'Silver', orders: 13, spent: 3100000, lastOrder: 'Hôm qua', status: 'Active' },
    { id: 'CUS-2404', name: 'Phạm Gia Hân', email: 'han.pham@email.vn', phone: '0977 880 119', tier: 'New', orders: 2, spent: 420000, lastOrder: '5 ngày trước', status: 'At risk' }
  ];

  get filteredCustomers(): CustomerSummary[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    return this.customers.filter((customer) => {
      const matchesTier = this.selectedTier === 'All' || customer.tier === this.selectedTier;
      const matchesKeyword = !keyword || [customer.name, customer.email, customer.phone, customer.id]
        .some((value) => value.toLowerCase().includes(keyword));
      return matchesTier && matchesKeyword;
    });
  }

  get totalRevenue(): number {
    return this.customers.reduce((sum, customer) => sum + customer.spent, 0);
  }

  get totalOrders(): number {
    return this.customers.reduce((sum, customer) => sum + customer.orders, 0);
  }

  get vipCount(): number {
    return this.customers.filter((customer) => customer.status === 'VIP').length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value) + 'đ';
  }
}
