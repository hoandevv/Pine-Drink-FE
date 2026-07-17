export const API_ENDPOINTS = {
  auth: {
    base: '/auth',
    register: '/auth/register',
    verifyRegisterOtp: '/auth/register/verify-otp',
    resendRegisterOtp: '/auth/register/resend-otp',
    login: '/auth/login',
    google: '/auth/google',
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
    setPassword: '/profile/set-password',
    avatar: '/profile/avatar'
  },
  accounts: {
    base: '/accounts',
    detail: (id: string) => `/accounts/${id}`,
    status: (id: string) => `/accounts/${id}/status`,
    roles: (id: string) => `/accounts/${id}/roles`,
    revokeRole: (id: string, assignmentId: string) => `/accounts/${id}/roles/${assignmentId}`
  },
  authorization: {
    base: '/authorization',
    permissions: '/authorization/permissions',
    rolePermissionsMatrix: '/authorization/role-permissions/matrix',
    rolePermissions: (role: string) => `/authorization/roles/${role}/permissions`
  },
  products: '/products',
  toppings: '/toppings',
  categories: '/categories',
  branches: '/branches',
  orders: '/orders',
  payments: {
    base: '/payments',
    offlineRecord: '/payments/offline/record',
    orderStatus: (orderId: string) => `/payments/orders/${orderId}/status`,
    momoCreate: '/payments/momo/create'
  },
  vouchers: {
    base: '/vouchers',
    customerAvailable: '/vouchers/customer/available',
    detail: (id: string) => `/vouchers/${id}`,
    status: (id: string) => `/vouchers/${id}/status`
  },
  reports: {
    jobs: '/reports/jobs',
    jobDetail: (id: string) => `/reports/jobs/${id}`,
    jobDownload: (id: string) => `/reports/jobs/${id}/download`,
    options: '/reports/jobs/options'
  },
  dashboard: {
    admin: '/admin/dashboard',
    overview: '/admin/dashboard/overview',
    revenueTrend: '/admin/dashboard/revenue-trend',
    orderStatus: '/admin/dashboard/order-status',
    topProducts: '/admin/dashboard/top-products',
    branchPerformance: '/admin/dashboard/branch-performance'
  },
  dailyStocks: {
    admin: '/admin/daily-stocks',
    branchPublic: (branchId: string) => `/branches/${branchId}/daily-stocks`,
    quota: (id: string) => `/admin/daily-stocks/${id}/quota`,
    copy: '/admin/daily-stocks/copy',
    logs: (id: string) => `/admin/daily-stocks/${id}/logs`
  },
  customerAddress: {
    base: '/customer/addresses',
    detail: (id: string) => `/customer/addresses/${id}`,
    setDefault: (id: string) => `/customer/addresses/${id}/set-default`
  },
  customerCart: '/customer/cart',
  geocoding: {
    search: '/geocoding/search',
    reverse: '/geocoding/reverse'
  },
  chat: {
    rooms: '/chat/rooms',
    staffRooms: '/chat/rooms/staff',
    roomDetail: (roomId: string) => `/chat/rooms/${roomId}`,
    roomMessages: (roomId: string) => `/chat/rooms/${roomId}/messages`
  },
  websocket: {
    base: '/ws'
  }
} as const;
