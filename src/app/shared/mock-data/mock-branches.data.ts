export interface MockBranch {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  openTime: string;
  closeTime: string;
  distance: string;
  distanceKm: number;
  image: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  hasPickup: boolean;
  hasDelivery: boolean;
  estimatedTime: string;
  rating: number;
}

export const MOCK_BRANCHES: MockBranch[] = [
  {
    id: 'branch-001',
    name: 'Pine Drink Nguyễn Trãi',
    address: '123 Nguyễn Trãi, Thanh Xuân',
    district: 'Thanh Xuân',
    city: 'Hà Nội',
    phone: '024 3856 7890',
    openTime: '07:00',
    closeTime: '22:30',
    distance: '1.2 km',
    distanceKm: 1.2,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
    latitude: 20.9967,
    longitude: 105.8129,
    isOpen: true,
    hasPickup: true,
    hasDelivery: true,
    estimatedTime: '10-15 phút',
    rating: 4.8
  },
  {
    id: 'branch-002',
    name: 'Pine Drink Cầu Giấy',
    address: '456 Xuân Thủy, Cầu Giấy',
    district: 'Cầu Giấy',
    city: 'Hà Nội',
    phone: '024 3756 1234',
    openTime: '07:00',
    closeTime: '22:30',
    distance: '2.5 km',
    distanceKm: 2.5,
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=900&q=80',
    latitude: 21.0378,
    longitude: 105.7826,
    isOpen: true,
    hasPickup: true,
    hasDelivery: false,
    estimatedTime: '15-20 phút',
    rating: 4.7
  },
  {
    id: 'branch-003',
    name: 'Pine Drink Hà Đông',
    address: '789 Quang Trung, Hà Đông',
    district: 'Hà Đông',
    city: 'Hà Nội',
    phone: '024 3368 9012',
    openTime: '07:30',
    closeTime: '22:00',
    distance: '4.8 km',
    distanceKm: 4.8,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=900&q=80',
    latitude: 20.9719,
    longitude: 105.7764,
    isOpen: true,
    hasPickup: false,
    hasDelivery: true,
    estimatedTime: '20-25 phút',
    rating: 4.6
  },
  {
    id: 'branch-004',
    name: 'Pine Drink Hoàn Kiếm',
    address: '45 Lý Thường Kiệt, Hoàn Kiếm',
    district: 'Hoàn Kiếm',
    city: 'Hà Nội',
    phone: '024 3926 3456',
    openTime: '08:00',
    closeTime: '23:00',
    distance: '2.8 km',
    distanceKm: 2.8,
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=900&q=80',
    latitude: 21.0245,
    longitude: 105.8412,
    isOpen: true,
    hasPickup: true,
    hasDelivery: true,
    estimatedTime: '12-18 phút',
    rating: 4.9
  },
  {
    id: 'branch-005',
    name: 'Pine Drink Đống Đa',
    address: '234 Láng Hạ, Đống Đa',
    district: 'Đống Đa',
    city: 'Hà Nội',
    phone: '024 3514 7890',
    openTime: '07:00',
    closeTime: '22:30',
    distance: '3.2 km',
    distanceKm: 3.2,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
    latitude: 21.0134,
    longitude: 105.8109,
    isOpen: true,
    hasPickup: true,
    hasDelivery: true,
    estimatedTime: '15-20 phút',
    rating: 4.7
  },
  {
    id: 'branch-006',
    name: 'Pine Drink Long Biên',
    address: '567 Nguyễn Văn Cừ, Long Biên',
    district: 'Long Biên',
    city: 'Hà Nội',
    phone: '024 3872 5678',
    openTime: '07:30',
    closeTime: '22:00',
    distance: '5.5 km',
    distanceKm: 5.5,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=900&q=80',
    latitude: 21.0365,
    longitude: 105.8938,
    isOpen: true,
    hasPickup: true,
    hasDelivery: true,
    estimatedTime: '20-30 phút',
    rating: 4.5
  }
];
