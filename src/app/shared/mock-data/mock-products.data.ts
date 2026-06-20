export interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
  categoryId: string;
  categoryName: string;
  rating: number;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNew: boolean;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'Trà sữa trân châu đường đen',
    description: 'Sữa tươi thanh trùng, syrup đường đen nấu chậm và trân châu dẻo mỗi ngày.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80',
    badge: 'Best Seller',
    categoryId: 'cat-001',
    categoryName: 'Trà sữa',
    rating: 4.9,
    isAvailable: true,
    isBestSeller: true,
    isNew: false
  },
  {
    id: 'prod-002',
    name: 'Matcha Latte kem cheese',
    description: 'Matcha Uji đậm vị với lớp kem cheese mặn béo và hậu vị thanh mát.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
    badge: 'Signature',
    categoryId: 'cat-005',
    categoryName: 'Matcha',
    rating: 4.8,
    isAvailable: true,
    isBestSeller: true,
    isNew: false
  },
  {
    id: 'prod-003',
    name: 'Trà đào cam sả',
    description: 'Trà đen ủ lạnh, đào miếng giòn, cam vàng và sả cây nhẹ cực tinh tao.',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80',
    badge: 'Fresh Pick',
    categoryId: 'cat-002',
    categoryName: 'Trà trái cây',
    rating: 4.7,
    isAvailable: true,
    isBestSeller: true,
    isNew: false
  },
  {
    id: 'prod-004',
    name: 'Cold Brew sữa yến mạch',
    description: 'Cold brew 18 giờ, sữa yến mạch mềm vị và foam muối biển siêu nhẹ.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80',
    badge: 'New',
    categoryId: 'cat-003',
    categoryName: 'Cafe',
    rating: 4.8,
    isAvailable: true,
    isBestSeller: false,
    isNew: true
  },
  {
    id: 'prod-005',
    name: 'Sữa tươi trân châu đường đen',
    description: 'Sữa tươi Vinamilk nguyên chất, trân châu đen dẻo dai nấu thủ công.',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=900&q=80',
    badge: 'Best Seller',
    categoryId: 'cat-001',
    categoryName: 'Trà sữa',
    rating: 4.9,
    isAvailable: true,
    isBestSeller: true,
    isNew: false
  },
  {
    id: 'prod-006',
    name: 'Chocolate đá xay',
    description: 'Chocolate Bỉ cao cấp xay với đá mịn, topping kem tươi và sốt chocolate.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=900&q=80',
    badge: 'Hot',
    categoryId: 'cat-004',
    categoryName: 'Đá xay',
    rating: 4.6,
    isAvailable: true,
    isBestSeller: false,
    isNew: false
  },
  {
    id: 'prod-007',
    name: 'Trà sữa Oolong',
    description: 'Trà Oolong Đài Loan thượng hạng, sữa tươi và topping trân châu trắng.',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=900&q=80',
    categoryId: 'cat-001',
    categoryName: 'Trà sữa',
    rating: 4.7,
    isAvailable: true,
    isBestSeller: false,
    isNew: false
  },
  {
    id: 'prod-008',
    name: 'Trà vải lychee',
    description: 'Trà xanh Thái Nguyên, vải thiều tươi và lychee jelly thanh mát.',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
    badge: 'New',
    categoryId: 'cat-002',
    categoryName: 'Trà trái cây',
    rating: 4.8,
    isAvailable: true,
    isBestSeller: false,
    isNew: true
  },
  {
    id: 'prod-009',
    name: 'Cafe đen đá',
    description: 'Cafe Robusta Đắk Lắk rang vừa, pha phin truyền thống đậm đà.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
    categoryId: 'cat-003',
    categoryName: 'Cafe',
    rating: 4.5,
    isAvailable: true,
    isBestSeller: false,
    isNew: false
  },
  {
    id: 'prod-010',
    name: 'Cafe sữa đá',
    description: 'Cafe phin truyền thống pha với sữa đặc Ông Thọ thơm ngon.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=900&q=80',
    badge: 'Best Seller',
    categoryId: 'cat-003',
    categoryName: 'Cafe',
    rating: 4.8,
    isAvailable: true,
    isBestSeller: true,
    isNew: false
  },
  {
    id: 'prod-011',
    name: 'Matcha đá xay',
    description: 'Matcha Nhật Bản xay với đá mịn, topping kem tươi và bột matcha.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1536013564743-5e447d2a3a59?auto=format&fit=crop&w=900&q=80',
    categoryId: 'cat-005',
    categoryName: 'Matcha',
    rating: 4.7,
    isAvailable: true,
    isBestSeller: false,
    isNew: false
  },
  {
    id: 'prod-012',
    name: 'Trà sữa Thái xanh',
    description: 'Trà xanh Thái Lan đặc trưng, sữa đặc và topping trân châu trắng.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80',
    categoryId: 'cat-001',
    categoryName: 'Trà sữa',
    rating: 4.6,
    isAvailable: true,
    isBestSeller: false,
    isNew: false
  }
];
