import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CustomerAddressService } from '../../../../core/services/customer-address.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateAddressRequest, CustomerAddress, UpdateAddressRequest } from '../../../../shared/models/customer-address.model';
import { MapPickerResult } from '../../components/map-picker/map-picker.component';

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss']
})
export class AddressFormComponent implements OnInit {
  addressForm!: FormGroup;
  isEditMode = false;
  addressId: string | null = null;
  isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly addressService: CustomerAddressService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.addressForm = this.fb.group({
      receiverName: ['', [Validators.required, Validators.minLength(2)]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      addressLine: ['', [Validators.required, Validators.minLength(5)]],
      ward: [''],
      district: [''],
      city: [''],
      latitude: [null],
      longitude: [null],
      isDefault: [false]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.addressId = id;
      this.loadAddress(this.addressId);
    }
  }

  private loadAddress(id: string): void {
    this.loadingService.show();
    this.addressService
      .getAddressById(id)
      .pipe(
        catchError((error) => {
          this.toastService.error('Không thể tải thông tin địa chỉ');
          this.router.navigate(['/addresses']);
          return of(null);
        })
      )
      .subscribe((address) => {
        this.loadingService.hide();
        if (address) {
          this.populateForm(address);
        }
      });
  }

  private populateForm(address: CustomerAddress): void {
    this.addressForm.patchValue({
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      addressLine: address.addressLine,
      ward: address.ward,
      district: address.district,
      city: address.city,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault
    });
  }


  onLocationSelected(location: MapPickerResult): void {
    this.addressForm.patchValue({
      addressLine: location.addressLine || this.addressForm.value.addressLine,
      ward: location.ward || this.addressForm.value.ward,
      district: location.district || this.addressForm.value.district,
      city: location.city || this.addressForm.value.city,
      latitude: location.latitude,
      longitude: location.longitude
    });
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      this.toastService.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const { latitude, longitude } = this.addressForm.value;
    if (!latitude || !longitude) {
      this.toastService.error('Vui lòng chọn vị trí trên bản đồ');
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode && this.addressId) {
      this.updateAddress();
    } else {
      this.createAddress();
    }
  }

  private createAddress(): void {
    const request: CreateAddressRequest = this.addressForm.value;

    this.addressService
      .createAddress(request)
      .pipe(
        catchError((error) => {
          this.isSubmitting = false;
          this.toastService.error('Không thể tạo địa chỉ. Vui lòng thử lại');
          return of(null);
        })
      )
      .subscribe((address) => {
        this.isSubmitting = false;
        if (address) {
          this.toastService.success('Đã thêm địa chỉ thành công');
          this.router.navigate(['/addresses']);
        }
      });
  }

  private updateAddress(): void {
    if (!this.addressId) return;

    const request: UpdateAddressRequest = this.addressForm.value;

    this.addressService
      .updateAddress(this.addressId, request)
      .pipe(
        catchError((error) => {
          this.isSubmitting = false;
          this.toastService.error('Không thể cập nhật địa chỉ. Vui lòng thử lại');
          return of(null);
        })
      )
      .subscribe((address) => {
        this.isSubmitting = false;
        if (address) {
          this.toastService.success('Đã cập nhật địa chỉ thành công');
          this.router.navigate(['/addresses']);
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/addresses']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.addressForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Trường này là bắt buộc';
    if (field.errors['minlength']) return `Tối thiểu ${field.errors['minlength'].requiredLength} ký tự`;
    if (field.errors['pattern']) return 'Số điện thoại không hợp lệ';

    return '';
  }
}
