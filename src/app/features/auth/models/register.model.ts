export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string | null;
  siteKey: string;
}

export interface RegisterResponseData {
  userId: string;
  username: string;
  email: string;
  message: string;
}

export interface VerifyRegisterOtpRequest {
  email: string;
  otp: string;
}

export interface ResendRegisterOtpRequest {
  email: string;
}
