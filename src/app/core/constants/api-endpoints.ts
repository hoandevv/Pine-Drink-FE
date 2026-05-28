export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyRegisterOtp: '/auth/register/verify-otp',
    resendRegisterOtp: '/auth/register/resend-otp',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    verifyForgotPasswordOtp: '/auth/forgot-password/verify-otp',
    resetPassword: '/auth/reset-password'
  },
  profile: {
    base: '/profile',
    password: '/profile/password',
    avatar: '/profile/avatar'
  },
  products: '/products',
  orders: '/orders'
} as const;
