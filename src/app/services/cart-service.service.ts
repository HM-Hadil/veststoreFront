import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Product } from './product.service';

export interface CartItem {
name: any;
  id?: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id?: number;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartServiceService {
  private apiUrl = 'http://localhost:9094/api/cart';
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalQuantity: 0, totalPrice: 0 });
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    const cartItem = {
      productId: product.id,
      quantity: quantity
    };

    return this.http.post<Cart>(`${this.apiUrl}/items`, cartItem).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  updateCartItem(itemId: number, quantity: number): Observable<Cart> {
    const cartItem = {
      quantity: quantity
    };

    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, cartItem).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeCartItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(() => this.loadCart())
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.apiUrl).pipe(
      tap(() => this.cartSubject.next({ items: [], totalQuantity: 0, totalPrice: 0 }))
    );
  }

  private loadCart(): void {
    this.getCart().subscribe({
      next: (cart) => this.cartSubject.next(cart),
      error: (error) => {
        console.error('Erreur lors du chargement du panier', error);
        this.cartSubject.next({ items: [], totalQuantity: 0, totalPrice: 0 });
      }
    });
  }

  // Vérification du stock avant validation
  checkProductStock(productId: number, requestedQuantity: number): Observable<boolean> {
    return this.http.get<Product>(`/api/products/${productId}`).pipe(
      map(product => product.stock >= requestedQuantity)
    );
  }
}