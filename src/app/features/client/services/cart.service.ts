import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';

export interface CartItemTopping {
  id: string;
  toppingId: string;
  toppingName: string;
  price: number;
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

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.customerCart}`;
  private readonly cartSubject = new BehaviorSubject<Cart | null>(null);

  readonly cart$ = this.cartSubject.asObservable();
  readonly cartCount$ = this.cart$.pipe(map(cart => cart?.totalQuantity || 0));
  readonly cartTotal$ = this.cart$.pipe(map(cart => cart?.subtotalAmount || 0));

  constructor(private readonly http: HttpClient) {}

  getActiveCart(branchId: string): Observable<Cart> {
    const params = new HttpParams().set('branchId', branchId);
    return this.http.get<BaseResponse<Cart>>(this.apiUrl, { params }).pipe(
      map(res => this.normalizeCart(res.data)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItem(request: AddCartItemRequest): Observable<Cart> {
    return this.http.post<BaseResponse<Cart>>(`${this.apiUrl}/items`, request).pipe(
      map(res => this.normalizeCart(res.data)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeItem(itemId: string): Observable<Cart> {
    return this.http.delete<BaseResponse<Cart>>(`${this.apiUrl}/items/${itemId}`).pipe(
      map(res => this.normalizeCart(res.data)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  syncCart(items: CartItem[], branchId = sessionStorage.getItem('selectedBranchId') || ''): void {
    const normalizedItems = items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice) || 0,
      toppingAmount: Number(item.toppingAmount) || 0,
      totalPrice: Number(item.totalPrice) || 0,
      quantity: Number(item.quantity) || 0,
      toppings: item.toppings || []
    }));

    this.cartSubject.next({
      branchId,
      items: normalizedItems,
      totalQuantity: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount: normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    });
  }

  clearCart(): void {
    this.cartSubject.next(null);
  }

  private normalizeCart(cart: Cart): Cart {
    const items = (cart?.items || []).map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice) || 0,
      toppingAmount: Number(item.toppingAmount) || 0,
      totalPrice: Number(item.totalPrice) || 0,
      toppings: (item.toppings || []).map(topping => ({ ...topping, price: Number(topping.price) || 0 }))
    }));

    return {
      ...cart,
      items,
      totalQuantity: Number(cart?.totalQuantity) || items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount: Number(cart?.subtotalAmount) || items.reduce((sum, item) => sum + item.totalPrice, 0)
    };
  }
}
