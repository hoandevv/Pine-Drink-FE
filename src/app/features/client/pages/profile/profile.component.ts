import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TokenService } from '../../../../core/services/token.service';
import { LanguageService, Language } from '../../../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomerAddressService } from '../../../../core/services/customer-address.service';
import { CustomerAddress } from '../../../../shared/models/customer-address.model';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  avatar: string;
  loyaltyPoints: number;
  memberSince: string;
  authProvider: string;
  hasLocalPassword: boolean;
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
    dateOfBirth: '',
    gender: 'OTHER',
    avatar: '',
    loyaltyPoints: 1250,
    memberSince: '',
    authProvider: 'LOCAL',
    hasLocalPassword: true
  };

  recentOrders: Order[] = [];

  activeTab: 'info' | 'orders' | 'favorites' | 'settings' = 'info';
  showLanguageSelector: boolean = false;
  showChangePasswordModal: boolean = false;
  showEditProfileModal: boolean = false;

  changePasswordForm!: FormGroup;
  editProfileForm!: FormGroup;

  uploadingAvatar = false;
  changingPassword = false;
  updatingProfile = false;
  errorMessage = '';
  successMessage = '';

  addresses: CustomerAddress[] = [];
  loadingAddresses = false;
  showAvatarPreview = false;
  passwordVisibility = {
    current: false,
    new: false,
    confirm: false
  };

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly fb: FormBuilder,
    public languageService: LanguageService,
    public translate: TranslateService,
    private readonly addressService: CustomerAddressService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
    this.loadAddresses();

    // Clear data and redirect if user logs out while on this page
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.resetComponentState();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  private resetComponentState(): void {
    this.user = {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'OTHER',
      avatar: '',
      loyaltyPoints: 0,
      memberSince: '',
      authProvider: 'LOCAL',
      hasLocalPassword: true
    };
    this.recentOrders = [];
    this.addresses = [];
  }

  initForms(): void {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: [''],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ]
        ],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );

    this.editProfileForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,20}$/)]],
      dateOfBirth: [''],
      gender: ['OTHER']
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { mismatch: true };
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user.name = profile.fullName || profile.username || 'Người dùng';
        this.user.email = profile.email;
        this.user.phone = profile.phone || '0123456789';
        this.user.dateOfBirth = profile.dateOfBirth || '';
        this.user.gender = profile.gender || 'OTHER';

        // Backend now returns full MinIO URLs for public files (avatars)
        // Example: http://localhost:9000/pine-drink-public/avatars/uuid.jpg
        // Use the URL directly as provided by the backend
        this.user.avatar = profile.avatarUrl || '';
        this.user.authProvider = (profile.authProvider || 'LOCAL').toUpperCase();
        this.user.hasLocalPassword = Boolean(profile.hasLocalPassword);
        this.user.memberSince = profile.createdAt || '';
        this.syncPasswordFormMode();
        console.log('[Profile] Avatar URL:', this.user.avatar);
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        // Fallback to token data
        const currentUser = this.tokenService.getCurrentUserFromToken();
        if (currentUser) {
          this.user.name = currentUser.fullName || currentUser.username || 'Người dùng';
          this.user.email = currentUser.email;
          this.user.phone = currentUser.phone || '0123456789';
          this.user.dateOfBirth = currentUser.dateOfBirth || '';
          this.user.gender = currentUser.gender || 'OTHER';
          this.user.avatar = currentUser.avatarUrl || '';
          this.user.authProvider = (currentUser.authProvider || 'LOCAL').toUpperCase();
          this.user.hasLocalPassword = Boolean(currentUser.hasLocalPassword);
          this.user.memberSince = currentUser.createdAt || '';
          this.syncPasswordFormMode();
        }
      }
    });
  }

  loadAddresses(): void {
    this.loadingAddresses = true;
    this.addressService
      .getAddresses()
      .pipe(
        catchError((error) => {
          console.error('Failed to load addresses:', error);
          this.loadingAddresses = false;
          return of([]);
        })
      )
      .subscribe((addresses) => {
        console.log('[Profile] Response from addressService:', addresses);
        this.addresses = addresses || [];
        this.loadingAddresses = false;
        console.log('[Profile] Current addresses count:', this.addresses.length);
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

  setActiveTab(tab: 'info' | 'orders' | 'favorites' | 'settings'): void {
    this.activeTab = tab;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  formatDate(dateValue: string | number[] | null | undefined): string {
    if (!dateValue) {
      return 'Chưa có dữ liệu';
    }

    const date = Array.isArray(dateValue)
      ? new Date(
          dateValue[0],
          (dateValue[1] || 1) - 1,
          dateValue[2] || 1,
          dateValue[3] || 0,
          dateValue[4] || 0,
          dateValue[5] || 0
        )
      : new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Chưa có dữ liệu';
    }

    const currentLang = this.languageService.getCurrentLanguage();
    return date.toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US');
  }

  getStatusText(status: string): string {
    return this.translate.instant(`profile.orders.${status}`);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getUserInitials(): string {
    if (!this.user.name) return 'U';

    const words = this.user.name.trim().split(/\s+/);

    if (words.length === 1) {
      // Single word: take first 2 letters
      return words[0].substring(0, 2).toUpperCase();
    }

    // Multiple words: take first letter of each word (max 3)
    return words
      .slice(0, 3)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  editProfile(): void {
    this.editProfileForm.patchValue({
      fullName: this.user.name,
      phone: this.user.phone,
      dateOfBirth: this.user.dateOfBirth,
      gender: this.user.gender
    });
    this.showEditProfileModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitProfileUpdate(): void {
    if (this.editProfileForm.invalid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    this.updatingProfile = true;
    this.errorMessage = '';

    this.authService.updateProfile(this.editProfileForm.value).subscribe({
      next: (updatedProfile) => {
        this.updatingProfile = false;
        this.user.name = updatedProfile.fullName || updatedProfile.username || this.user.name;
        this.user.phone = updatedProfile.phone || this.user.phone;
        this.user.dateOfBirth = updatedProfile.dateOfBirth || this.user.dateOfBirth;
        this.user.gender = updatedProfile.gender || this.user.gender;
        this.successMessage = 'Cập nhật thông tin thành công!';
        setTimeout(() => {
          this.showEditProfileModal = false;
          this.successMessage = '';
        }, 1500);
      },
      error: (error) => {
        this.updatingProfile = false;
        this.errorMessage = error?.error?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.';
      }
    });
  }

  changePassword(): void {
    this.syncPasswordFormMode();
    this.showChangePasswordModal = true;
    this.changePasswordForm.reset();
    this.resetPasswordVisibility();
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }

  private resetPasswordVisibility(): void {
    this.passwordVisibility = {
      current: false,
      new: false,
      confirm: false
    };
  }

  get isGoogleOnlyAccount(): boolean {
    return this.user.authProvider?.toUpperCase() === 'GOOGLE' && this.user.hasLocalPassword === false;
  }

  get passwordActionTitle(): string {
    return this.isGoogleOnlyAccount ? 'Thiết lập mật khẩu' : 'Đổi mật khẩu';
  }

  get passwordActionDescription(): string {
    return this.isGoogleOnlyAccount
      ? 'Tài khoản Google chưa có mật khẩu cục bộ. Thiết lập để có thể đăng nhập bằng email và mật khẩu.'
      : 'Cập nhật mật khẩu đăng nhập cho tài khoản của bạn.';
  }

  private syncPasswordFormMode(): void {
    const currentPassword = this.changePasswordForm?.get('currentPassword');
    if (!currentPassword) return;

    if (this.isGoogleOnlyAccount) {
      currentPassword.clearValidators();
      currentPassword.disable({ emitEvent: false });
    } else {
      currentPassword.enable({ emitEvent: false });
      currentPassword.setValidators([Validators.required]);
    }

    currentPassword.updateValueAndValidity({ emitEvent: false });
  }

  submitPasswordChange(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.changingPassword = true;
    this.errorMessage = '';

    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.getRawValue();
    const wasGoogleOnlyAccount = this.isGoogleOnlyAccount;
    const request$ = wasGoogleOnlyAccount
      ? this.authService.setPassword({ newPassword, confirmPassword })
      : this.authService.changePassword({ currentPassword, newPassword, confirmPassword });

    request$.subscribe({
      next: () => {
        this.changingPassword = false;
        this.user.hasLocalPassword = true;
        const storedUser = this.tokenService.getStoredUser();
        if (storedUser) {
          storedUser.hasLocalPassword = true;
          this.tokenService.setCurrentUser(storedUser);
        }
        this.successMessage = wasGoogleOnlyAccount ? 'Thiết lập mật khẩu thành công!' : 'Đổi mật khẩu thành công!';
        setTimeout(() => {
          this.showChangePasswordModal = false;
          this.successMessage = '';
          this.changePasswordForm.reset();
          this.syncPasswordFormMode();
        }, 1500);
      },
      error: (error) => {
        this.changingPassword = false;
        this.errorMessage = error?.error?.message || 'Không thể xử lý mật khẩu. Vui lòng kiểm tra lại.';
      }
    });
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log('[Avatar Upload] File input triggered', input);

    if (!input.files || input.files.length === 0) {
      console.log('[Avatar Upload] No file selected');
      return;
    }

    const file = input.files[0];
    console.log('[Avatar Upload] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('[Avatar Upload] Invalid file type:', file.type);
      this.errorMessage = 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP).';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[Avatar Upload] File too large:', file.size);
      this.errorMessage = 'Kích thước file không được vượt quá 5MB.';
      return;
    }

    console.log('[Avatar Upload] Starting upload...');
    this.uploadingAvatar = true;
    this.errorMessage = '';

    this.authService.uploadAvatar(file).subscribe({
      next: (response: any) => {
        console.log('[Avatar Upload] Upload successful:', response);
        this.uploadingAvatar = false;

        // Backend returns full MinIO URL for public files (avatars)
        // Example: http://localhost:9000/pine-drink-public/avatars/uuid.jpg
        const avatarUrl = response?.data?.fileUrl || response?.fileUrl;

        if (!avatarUrl) {
          console.error('[Avatar Upload] Missing fileUrl:', response);
          this.errorMessage = 'Upload thành công nhưng không nhận được URL ảnh.';
          return;
        }

        // Add cache-busting timestamp to force browser to reload the image
        this.user.avatar = avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        console.log('[Avatar Upload] Avatar URL set to:', this.user.avatar);

        // Update stored user data
        const storedUser = this.tokenService.getStoredUser();
        if (storedUser) {
          storedUser.avatarUrl = avatarUrl;
          this.tokenService.setCurrentUser(storedUser);
        }

        this.successMessage = 'Cập nhật ảnh đại diện thành công!';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('[Avatar Upload] Upload failed:', error);
        this.uploadingAvatar = false;

        // Enhanced error message
        let errorMsg = 'Không thể tải ảnh lên. ';
        if (error.status === 0) {
          errorMsg += 'Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.';
        } else if (error.status === 413) {
          errorMsg += 'File quá lớn.';
        } else if (error.status === 415) {
          errorMsg += 'Định dạng file không được hỗ trợ.';
        } else if (error.error?.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += 'Vui lòng thử lại.';
        }

        this.errorMessage = errorMsg;
      }
    });
  }

  triggerAvatarUpload(): void {
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onAvatarLoadError(): void {
    console.error('[Avatar] Image failed to load. Check if URL is correct and accessible:', this.user.avatar);
    // Don't clear immediately to let user inspect the element in DevTools
    // but we can set a flag or use a fallback after some delay if needed
    // For now, let's keep it for debugging
    // this.user.avatar = ''; 
  }

  onAvatarLoadSuccess(): void {
    console.log('[Avatar] Image loaded successfully:', this.user.avatar);
  }

  openLanguageSelector(): void {
    this.showLanguageSelector = true;
  }

  closeLanguageSelector(): void {
    this.showLanguageSelector = false;
  }

  selectLanguage(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
    this.closeLanguageSelector();
  }

  getCurrentLanguageName(): string {
    const currentLang = this.languageService.getCurrentLanguageInfo();
    return currentLang ? currentLang.name : 'Tiếng Việt';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.changePasswordForm.reset();
    this.resetPasswordVisibility();
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
    this.editProfileForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }
}
