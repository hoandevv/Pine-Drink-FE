export interface UserProfile {
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

export interface Order {
  id: string;
  date: string;
  items: number;
  total: number;
  status: string;
}
