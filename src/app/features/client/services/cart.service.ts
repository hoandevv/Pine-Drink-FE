import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { CategoryService } from '../../categories/services/category.service';
import { ProductService } from '../../products/services/product.service';

import { Cart, CartItem, AddCartItemRequest } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.customerCart}`;
  private readonly cartSubject = new BehaviorSubject<Cart | null>(null);

  readonly cart$ = this.cartSubject.asObservable();
  readonly cartCount$ = this.cart$.pipe(map(cart => cart?.totalQuantity || 0));
  readonly cartTotal$ = this.cart$.pipe(map(cart => cart?.subtotalAmount || 0));

  constructor(
    private readonly http: HttpClient,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {}

  getActiveCart(branchId: string): Observable<Cart> {
    const params = new HttpParams().set('branchId', branchId);
    return forkJoin({
      cart: this.http.get<BaseResponse<Cart>>(this.apiUrl, { params }).pipe(
        map(res => this.normalizeCart(res.data))
      ),
      productsPage: this.productService.getProductSummaries(0, 1000, '', '', 'ACTIVE'),
      categories: this.categoryService.getActiveCategories()
    }).pipe(
      map(({ cart, productsPage, categories }) => this.filterVisibleCartItems(cart, productsPage.content, categories.map(category => category.id))),
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
      toppings: (item.toppings || []).map(topping => {
        const quantity = Number(topping.quantity) || 1;
        const unitPrice = Number(topping.unitPrice) || Number(topping.price) || 0;
        const totalPrice = Number(topping.totalPrice) || unitPrice * quantity;

        return {
          ...topping,
          quantity,
          unitPrice,
          totalPrice,
          price: unitPrice
        };
      })
    }));

    return {
      ...cart,
      items,
      totalQuantity: Number(cart?.totalQuantity) || items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount: Number(cart?.subtotalAmount) || items.reduce((sum, item) => sum + item.totalPrice, 0)
    };
  }

  private filterVisibleCartItems(cart: Cart, products: Array<{ id: string; status?: string; categoryId?: string }>, activeCategoryIds: string[]): Cart {
    const activeCategoryIdSet = new Set(activeCategoryIds);
    const visibleProductIds = new Set(
      products
        .filter(product => product.status === 'ACTIVE' && (!product.categoryId || activeCategoryIdSet.has(product.categoryId)))
        .map(product => product.id)
    );
    const items = cart.items.filter(item => visibleProductIds.has(item.productId));

    return {
      ...cart,
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0)
    };
  }
}
