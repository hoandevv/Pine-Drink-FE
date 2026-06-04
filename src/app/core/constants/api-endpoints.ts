export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyRegisterOtp: '/auth/register/verify-otp',
    resendRegisterOtp: '/auth/register/resend-otp',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    me: '/auth/me',
    permissions: '/auth/me/permissions',
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
  toppings: '/toppings',
  categories: '/categories',
  branches: '/branches',
  orders: '/orders',
  customerAddress: {
    base: '/customer/addresses',
    detail: (id: string) => `/customer/addresses/${id}`,
    setDefault: (id: string) => `/customer/addresses/${id}/set-default`
  },
  geocoding: {
    search: '/geocoding/search',
    reverse: '/geocoding/reverse'
  }
} as const;
