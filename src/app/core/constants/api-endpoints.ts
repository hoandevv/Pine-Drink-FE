export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyRegisterOtp: '/auth/register/verify-otp',
    resendRegisterOtp: '/auth/register/resend-otp',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    me: '/auth/me'
  },
  products: '/products',
  orders: '/orders'
} as const;
