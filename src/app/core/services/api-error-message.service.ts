import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ApiError } from '../../shared/models/api-error.model';
import { FieldError } from '../../shared/models/field-error.model';

interface ErrorPayload {
  errorCode?: string | null;
  message?: string | null;
  fieldErrors?: FieldError[] | null;
  errors?: FieldError[] | null;
  retryAfter?: number | null;
  traceId?: string | null;
  timestamp?: string | null;
  status?: number | null;
  success?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorMessageService {
  private readonly messages: Record<string, string> = {
    COM_001: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
    COM_002: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
    COM_003: 'Dữ liệu gửi lên không đúng định dạng.',
    COM_004: 'Tham số yêu cầu chưa hợp lệ.',
    COM_005: 'Không tìm thấy dữ liệu phù hợp.',
    AUTH_001: 'Tên đăng nhập/email hoặc mật khẩu chưa đúng.',
    AUTH_002: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
    AUTH_003: 'Thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.',
    AUTH_004: 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.',
    AUTH_005: 'Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.',
    AUTH_006: 'Tài khoản chưa được kích hoạt. Vui lòng xác thực OTP trước khi đăng nhập.',
    AUTH_007: 'Bạn chưa có quyền thực hiện thao tác này.',
    AUTH_008: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.',
    AUTH_009: 'Dịch vụ giới hạn truy cập đang tạm thời gián đoạn.',
    AUTH_010: 'Mật khẩu chưa đủ mạnh.',
    AUTH_011: 'Mã đặt lại mật khẩu đã hết hạn.',
    AUTH_012: 'Không tìm thấy tài khoản tương ứng.',
    AUTH_013: 'Tên đăng nhập này đã được sử dụng.',
    AUTH_014: 'Email này đã được sử dụng.',
    AUTH_015: 'Số điện thoại này đã được sử dụng.',
    AUTH_016: 'Mã OTP chưa đúng. Vui lòng kiểm tra lại.',
    AUTH_017: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.',
    AUTH_018: 'Tài khoản này đã được kích hoạt.',
    AUTH_019: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng gửi lại mã mới.',
    AUTH_020: 'Vui lòng chờ 60 giây trước khi yêu cầu gửi lại OTP.',
    AUTH_021: 'Tài khoản chưa được gán vào trung tâm hoạt động.',
    AUTH_022: 'Kênh đăng ký không hợp lệ.',
    AUTH_023: 'Kênh đăng ký này hiện chưa mở đăng ký công khai.',
    AUTH_024: 'Tên miền trung tâm đã tồn tại.',
    AUTH_025: 'Tài khoản đã có mật khẩu đăng nhập.',
    AUTH_026: 'Tài khoản chưa thiết lập mật khẩu đăng nhập.',
    AUTH_027: 'Mật khẩu xác nhận không khớp.',
    AUTH_028: 'Thao tác cần đăng nhập',
    AUTH_GOOGLE_001: 'Thiếu mã xác thực Google.',
    AUTH_GOOGLE_002: 'Mã xác thực Google không hợp lệ.',
    AUTH_GOOGLE_003: 'Email Google chưa được xác minh.',
    AUTH_GOOGLE_004: 'Email này đã được dùng bởi phương thức đăng nhập khác.',
    AUTH_GOOGLE_005: 'Tài khoản Google không khớp với tài khoản hiện có.',
    RATE_001: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.',
    ROLE_001: 'Không tìm thấy vai trò phù hợp.',
    SCOPE_001: 'Không tìm thấy phạm vi quyền phù hợp.',
    CUSTOMER_001: 'Không tìm thấy hồ sơ khách hàng.',
    CUSTOMER_002: 'Không tìm thấy địa chỉ khách hàng.',
    CUSTOMER_003: 'Địa chỉ này không thuộc khách hàng hiện tại.',
    CUSTOMER_004: 'Không thể xóa địa chỉ mặc định.',
    CUSTOMER_005: 'Khách hàng đã có địa chỉ mặc định.',
    BRANCH_001: 'Không tìm thấy chi nhánh.',
    BRANCH_002: 'Mã chi nhánh đã tồn tại.',
    BRANCH_003: 'Không tìm thấy phạm vi chi nhánh.',
    BRANCH_004: 'Chi nhánh đã ngừng hoạt động.',
    BRANCH_005: 'Không tìm thấy giờ hoạt động của chi nhánh.',
    BRANCH_006: 'Giờ hoạt động cho ngày này đã tồn tại.',
    BRANCH_007: 'Giờ mở cửa phải trước giờ đóng cửa.',
    BRANCH_008: 'Không tìm thấy cấu hình bán sản phẩm tại chi nhánh.',
    BRANCH_009: 'Cấu hình bán sản phẩm tại chi nhánh đã tồn tại.',
    BRANCH_010: 'Không tìm thấy cấu hình bán topping tại chi nhánh.',
    BRANCH_011: 'Cấu hình bán topping tại chi nhánh đã tồn tại.',
    BRANCH_012: 'Thời gian bắt đầu phải trước thời gian kết thúc.',
    CATEGORY_001: 'Không tìm thấy danh mục.',
    CATEGORY_002: 'Mã danh mục đã tồn tại.',
    CATEGORY_003: 'Danh mục đã ngừng hoạt động.',
    TOPPING_001: 'Không tìm thấy topping.',
    TOPPING_002: 'Mã topping đã tồn tại.',
    TOPPING_003: 'Topping đã ngừng hoạt động.',
    TOPPING_004: 'Không tìm thấy topping của sản phẩm.',
    TOPPING_005: 'Topping của sản phẩm đã tồn tại.',
    TOPPING_006: 'Topping của sản phẩm đã ngừng hoạt động.',
    TOPPING_007: 'Topping này không thuộc sản phẩm đã chọn.',
    PRODUCT_001: 'Không tìm thấy sản phẩm.',
    PRODUCT_002: 'Mã sản phẩm đã tồn tại.',
    PRODUCT_003: 'Không tìm thấy phạm vi sản phẩm.',
    PRODUCT_004: 'Không tìm thấy danh mục sản phẩm.',
    PRODUCT_005: 'Sản phẩm đã ngừng hoạt động.',
    PRODUCT_006: 'Danh mục không thuộc phạm vi sản phẩm.',
    PRODUCT_007: 'Không tìm thấy biến thể sản phẩm.',
    PRODUCT_008: 'Mã biến thể sản phẩm đã tồn tại.',
    PRODUCT_009: 'Biến thể sản phẩm đã ngừng hoạt động.',
    PRODUCT_010: 'Biến thể này không thuộc sản phẩm đã chọn.',
    DAILY_STOCK_001: 'Không tìm thấy tồn kho trong ngày.',
    DAILY_STOCK_002: 'Số lượng tồn trong ngày không hợp lệ.',
    DAILY_STOCK_003: 'Số lượng tồn trong ngày không đủ.',
    DAILY_STOCK_004: 'Thông tin giữ tồn kho không hợp lệ.',
    ORDER_001: 'Không tìm thấy đơn hàng.',
    ORDER_002: 'Đơn hàng đã hết hạn và bị tự động từ chối.',
    ORDER_003: 'Đơn hàng không còn ở trạng thái chờ xác nhận.',
    PAYMENT_001: 'Cổng thanh toán đang tạm thời không khả dụng.',
    VOUCHER_001: 'Không tìm thấy voucher.',
    VOUCHER_002: 'Mã voucher đã tồn tại.',
    VOUCHER_003: 'Khoảng thời gian áp dụng voucher không hợp lệ.',
    VOUCHER_004: 'Quy tắc giảm giá của voucher không hợp lệ.',
    VOUCHER_005: 'Không thể xóa voucher vì đã có lịch sử sử dụng.',
    VOUCHER_006: 'Trạng thái voucher không hợp lệ.',
    VOUCHER_007: 'Phạm vi chi nhánh của voucher không hợp lệ.',
    CHAT_001: 'Không tìm thấy phòng chat.',
    CHAT_002: 'Bạn không có quyền truy cập phòng chat này.',
    CHAT_003: 'Nội dung tin nhắn không được để trống.',
    CHAT_004: 'Người gửi tin nhắn không hợp lệ.'
  };

  private readonly fieldNames: Record<string, string> = {
    username: 'Tên đăng nhập', password: 'Mật khẩu', confirmPassword: 'Xác nhận mật khẩu', oldPassword: 'Mật khẩu hiện tại', newPassword: 'Mật khẩu mới',
    fullName: 'Họ và tên', name: 'Tên', code: 'Mã', email: 'Email', phone: 'Số điện thoại', otp: 'OTP', siteKey: 'Kênh đăng ký',
    address: 'Địa chỉ', branchId: 'Chi nhánh', categoryId: 'Danh mục', productId: 'Sản phẩm', quantity: 'Số lượng', price: 'Giá', salePrice: 'Giá bán',
    status: 'Trạng thái', startAt: 'Thời gian bắt đầu', endAt: 'Thời gian kết thúc', discountValue: 'Giá trị giảm', minOrderAmount: 'Giá trị đơn tối thiểu'
  };

  resolve(error: unknown, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.'): string {
    const apiError = this.toApiError(error);
    const fieldMessage = this.resolveFieldErrors(apiError.fieldErrors ?? apiError.errors);
    if (fieldMessage) return fieldMessage;
    if (apiError.errorCode && this.messages[apiError.errorCode]) return this.messages[apiError.errorCode];
    if (apiError.message && this.isSafeVietnameseMessage(apiError.message)) return apiError.message;
    return this.resolveStatusMessage(apiError.status, fallback);
  }

  toApiError(error: unknown): ApiError {
    if (error instanceof HttpErrorResponse) {
      const payload = this.toPayload(error.error);
      return {
        success: payload.success ?? false,
        status: error.status,
        errorCode: payload.errorCode ?? undefined,
        message: payload.message ?? undefined,
        fieldErrors: payload.fieldErrors ?? payload.errors ?? [],
        errors: payload.errors ?? undefined,
        retryAfter: payload.retryAfter ?? undefined,
        traceId: payload.traceId ?? undefined,
        timestamp: payload.timestamp ?? undefined
      };
    }
    if (this.isApiError(error)) return { ...error, fieldErrors: error.fieldErrors ?? error.errors ?? [] };
    return { status: 0, message: undefined, fieldErrors: [] };
  }

  resolveFieldName(field: string): string {
    return this.fieldNames[field] || field;
  }

  private resolveFieldErrors(errors?: FieldError[] | null): string {
    if (!errors?.length) return '';
    return errors.map((fieldError) => `${this.resolveFieldName(fieldError.field)}: ${this.normalizeFieldMessage(fieldError.message)}`).join(' | ');
  }

  private normalizeFieldMessage(message: string): string {
    if (this.isSafeVietnameseMessage(message)) return message;
    const normalized = message.toLowerCase();
    if (normalized.includes('must not be blank') || normalized.includes('must not be empty')) return 'không được để trống';
    if (normalized.includes('must not be null')) return 'không được bỏ trống';
    if (normalized.includes('must be a well-formed email')) return 'không đúng định dạng email';
    if (normalized.includes('size must be between')) return 'độ dài chưa hợp lệ';
    if (normalized.includes('must be greater than or equal to')) return 'phải lớn hơn hoặc bằng giá trị tối thiểu';
    if (normalized.includes('must be less than or equal to')) return 'phải nhỏ hơn hoặc bằng giá trị tối đa';
    return 'chưa hợp lệ';
  }

  private resolveStatusMessage(status: number, fallback: string): string {
    switch (status) {
      case 0: return 'Không kết nối được tới server. Vui lòng kiểm tra mạng hoặc backend.';
      case 400: return 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.';
      case 401: return 'Bạn cần đăng nhập để tiếp tục.';
      case 403: return 'Bạn chưa có quyền thực hiện thao tác này.';
      case 404: return 'Không tìm thấy dữ liệu cần thao tác.';
      case 409: return 'Dữ liệu đang bị trùng hoặc xung đột.';
      case 429: return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
      case 500: return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
      default: return fallback;
    }
  }

  private isSafeVietnameseMessage(message: string): boolean {
    const value = message.trim();
    if (!value) return false;
    const technicalEnglish = /failed|error|invalid|forbidden|unauthorized|internal|malformed|not found|expired|required|exception|token|resource|request|validation/i;
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseChars.test(value) && !technicalEnglish.test(value);
  }

  private toPayload(payload: unknown): ErrorPayload {
    return payload && typeof payload === 'object' ? payload as ErrorPayload : {};
  }

  private isApiError(error: unknown): error is ApiError {
    return !!error && typeof error === 'object' && 'status' in error;
  }
}
