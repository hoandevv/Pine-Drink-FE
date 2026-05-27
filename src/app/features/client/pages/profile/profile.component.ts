import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../../../core/services/token.service';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  loyaltyPoints: number;
  memberSince: string;
}

interface Order {
  id: string;
  date: string;
  items: number;
  total: number;
  status: 'completed' | 'processing' | 'cancelled';
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: UserProfile = {
    name: 'Người dùng',
    email: 'user@example.com',
    phone: '0123456789',
    avatar: '',
    loyaltyPoints: 1250,
    memberSince: '2024-01-15'
  };

  recentOrders: Order[] = [
    {
      id: 'ORD-001',
      date: '2024-05-20',
      items: 3,
      total: 125000,
      status: 'completed'
    },
    {
      id: 'ORD-002',
      date: '2024-05-18',
      items: 2,
      total: 89000,
      status: 'completed'
    },
    {
      id: 'ORD-003',
      date: '2024-05-15',
      items: 4,
      total: 156000,
      status: 'completed'
    }
  ];

  activeTab: 'info' | 'orders' | 'favorites' | 'settings' = 'info';

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const currentUser = this.tokenService.getCurrentUserFromToken();
    if (currentUser) {
      this.user.name = currentUser.username || 'Người dùng';
      this.user.email = currentUser.email || 'user@example.com';
    }
  }

  setActiveTab(tab: 'info' | 'orders' | 'favorites' | 'settings'): void {
    this.activeTab = tab;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      completed: 'Hoàn thành',
      processing: 'Đang xử lý',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  editProfile(): void {
    // TODO: Implement edit profile functionality
    console.log('Edit profile');
  }

  changePassword(): void {
    // TODO: Implement change password functionality
    console.log('Change password');
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/auth/login']);
  }
}
