import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CustomerAddressService } from '../../../../core/services/customer-address.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CustomerAddress } from '../../../../shared/models/customer-address.model';

@Component({
  selector: 'app-address-list',
  templateUrl: './address-list.component.html',
  styleUrls: ['./address-list.component.scss']
})
export class AddressListComponent implements OnInit {
  addresses: CustomerAddress[] = [];
  isLoading = false;
  deleteConfirmId: string | null = null;

  constructor(
    private readonly addressService: CustomerAddressService,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.isLoading = true;
    this.addressService
      .getAddresses()
      .pipe(
        catchError((error) => {
          this.isLoading = false;
          this.toastService.error('Không thể tải danh sách địa chỉ');
          return of([]);
        })
      )
      .subscribe((addresses) => {
        this.addresses = addresses;
        this.isLoading = false;
      });
  }

  addAddress(): void {
    this.router.navigate(['/addresses/new']);
  }

  editAddress(id: string): void {
    this.router.navigate(['/addresses/edit', id]);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteAddress(id: string): void {
    this.loadingService.show();
    this.addressService
      .deleteAddress(id)
      .pipe(
        catchError((error) => {
          this.loadingService.hide();
          this.toastService.error('Không thể xóa địa chỉ');
          return of(false);
        })
      )
      .subscribe((result) => {
        this.loadingService.hide();
        if (result !== false) {
          this.toastService.success('Đã xóa địa chỉ thành công');
          this.deleteConfirmId = null;
          this.loadAddresses();
        }
      });
  }

  setDefault(id: string): void {
    this.loadingService.show();
    this.addressService
      .setDefaultAddress(id)
      .pipe(
        catchError((error) => {
          this.loadingService.hide();
          this.toastService.error('Không thể đặt địa chỉ mặc định');
          return of(null);
        })
      )
      .subscribe((result) => {
        this.loadingService.hide();
        if (result !== null) {
          this.toastService.success('Đã đặt địa chỉ mặc định');
          this.loadAddresses();
        }
      });
  }

  getFullAddress(address: CustomerAddress): string {
    const parts = [
      address.addressLine,
      address.ward,
      address.district,
      address.city
    ].filter(Boolean);
    return parts.join(', ');
  }

  hasCoordinates(address: CustomerAddress): boolean {
    return address.latitude !== null && address.longitude !== null;
  }
}
