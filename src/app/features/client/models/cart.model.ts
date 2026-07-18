export interface CartItemTopping {
  id: string;
  toppingId: string;
  toppingName: string;
  price: number;
  unitPrice?: number;
  totalPrice?: number;
  quantity?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productCode?: string;
  productName: string;
  productImageUrl?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  sugarLevel?: string;
  iceLevel?: string;
  note?: string;
  unitPrice: number;
  toppingAmount: number;
  totalPrice: number;
  toppings: CartItemTopping[];
}

export interface Cart {
  id?: string;
  status?: string;
  branchId: string;
  branchName?: string;
  customerId?: string;
  items: CartItem[];
  totalQuantity: number;
  subtotalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddCartItemRequest {
  branchId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  sugarLevel?: string;
  iceLevel?: string;
  note?: string;
  toppings: Array<{ toppingId: string; quantity?: number }>;
}
