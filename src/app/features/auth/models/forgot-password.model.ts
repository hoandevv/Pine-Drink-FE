export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordOtpResponseData {
  resetToken: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}
