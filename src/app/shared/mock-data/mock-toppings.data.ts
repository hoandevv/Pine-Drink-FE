export interface MockTopping {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: string;
  image?: string;
}

export const MOCK_TOPPINGS: MockTopping[] = [
  {
    id: 'topping-001',
    name: 'Trân châu đen',
    price: 5000,
    isAvailable: true,
    category: 'Trân châu',
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-002',
    name: 'Trân châu trắng',
    price: 5000,
    isAvailable: true,
    category: 'Trân châu',
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-003',
    name: 'Thạch rau câu',
    price: 5000,
    isAvailable: true,
    category: 'Thạch',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-004',
    name: 'Thạch đào',
    price: 7000,
    isAvailable: true,
    category: 'Thạch',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-005',
    name: 'Kem cheese',
    price: 10000,
    isAvailable: true,
    category: 'Kem',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-006',
    name: 'Kem tươi',
    price: 8000,
    isAvailable: true,
    category: 'Kem',
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-007',
    name: 'Pudding trứng',
    price: 8000,
    isAvailable: true,
    category: 'Pudding',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-008',
    name: 'Thạch lychee',
    price: 7000,
    isAvailable: true,
    category: 'Thạch',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-009',
    name: 'Trân châu hoàng kim',
    price: 8000,
    isAvailable: true,
    category: 'Trân châu',
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'topping-010',
    name: 'Thạch nha đam',
    price: 6000,
    isAvailable: true,
    category: 'Thạch',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200&q=80'
  }
];

export interface MockCartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  size: 'S' | 'M' | 'L';
  iceLevel: number;
  sugarLevel: number;
  toppings: MockTopping[];
  note?: string;
}

export interface MockCart {
  items: MockCartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  total: number;
}

export const MOCK_CART: MockCart = {
  items: [
    {
      id: 'cart-item-001',
      productId: 'prod-001',
      productName: 'Trà sữa trân châu đường đen',
      productImage: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80',
      quantity: 1,
      price: 39000,
      size: 'M',
      iceLevel: 70,
      sugarLevel: 100,
      toppings: [
        {
          id: 'topping-001',
          name: 'Trân châu đen',
          price: 5000,
          isAvailable: true,
          category: 'Trân châu'
        }
      ],
      note: 'Ít đá'
    },
    {
      id: 'cart-item-002',
      productId: 'prod-002',
      productName: 'Matcha Latte kem cheese',
      productImage: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
      quantity: 1,
      price: 45000,
      size: 'L',
      iceLevel: 50,
      sugarLevel: 70,
      toppings: [
        {
          id: 'topping-005',
          name: 'Kem cheese',
          price: 10000,
          isAvailable: true,
          category: 'Kem'
        }
      ]
    }
  ],
  subtotal: 104000,
  shippingFee: 0,
  discount: 20000,
  voucherCode: 'GIAM20K',
  total: 84000
};
