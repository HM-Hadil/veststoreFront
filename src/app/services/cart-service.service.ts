import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { CartDto } from '../models/CartDto';
import { CartItemDto } from '../models/CartItemDto';
import { CartStatus } from '../models/CartStatus';
import { Product } from './product.service';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:9094/api/cart'; // Ajustez l'URL selon votre configuration

  constructor(private http: HttpClient) { }

  
  // Get the auth token from localStorage
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Récupérer l'email depuis le token
  private getIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    try {
      const decoded: any = jwtDecode(token);
      return Number(decoded.sub) || null; 
    } catch (error) {
      console.error('Erreur lors du décodage du token', error);
      return null;
    }
  }
  
  private getUserId(): Observable<number> {
    const id = this.getIdFromToken();
    console.log('id',id)
    if (id === null) {
      return of(0);
    }
    return of(id);
  }
  
 
  // Ajouter un produit au panier - Nouvelle méthode pour simplifier l'ajout de produits
  addToCart(product: Product, quantity: number = 1): Observable<CartDto> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        
        const cartItem: CartItemDto = {
          id: 0, // ID géré par le backend
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          size: product.size,
          color: product.color,
          price: product.price,
          status: CartStatus.EN_ATTENTE 
        };
        
        return this.addItemToCart(userId, cartItem);
      })
    );
  }
  
  // Récupérer le panier d'un utilisateur
  getCart(): Observable<CartDto> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        return this.http.get<CartDto>(`${this.apiUrl}/${userId}`);
      })
    );
  }

  // Ajouter un article au panier
  addItemToCart(userId: number, cartItem: CartItemDto): Observable<CartDto> {
    let params = new HttpParams().set('userId', userId.toString());
    return this.http.post<CartDto>(`${this.apiUrl}/items`, cartItem, { params, headers: this.getAuthHeaders() });
  }

  // Mettre à jour la quantité d'un article dans le panier
  updateCartItem(itemId: number, quantity: number): Observable<CartDto> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        let params = new HttpParams().set('userId', userId.toString());
        return this.http.put<CartDto>(`${this.apiUrl}/items/${itemId}`, quantity, { params, headers: this.getAuthHeaders() });
      })
    );
  }

  // Récupérer tous les articles du panier (probablement admin)
  getAllCartItems(): Observable<CartItemDto[]> {
    return this.http.get<CartItemDto[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() });
  }

  // Supprimer un article du panier
  removeCartItem(cartItemId: number): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        let params = new HttpParams().set('userId', userId.toString());
        return this.http.delete<void>(`${this.apiUrl}/items/${cartItemId}`, { params, headers: this.getAuthHeaders() });
      })
    );
  }

  // Vider le panier
  clearCart(): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        let params = new HttpParams().set('userId', userId.toString());
        return this.http.delete<void>(`${this.apiUrl}`, { params, headers: this.getAuthHeaders() });
      })
    );
  }

  // Passer une commande
  placeOrder(): Observable<CartDto> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        let params = new HttpParams().set('userId', userId.toString());
        return this.http.post<CartDto>(`${this.apiUrl}/checkout`, null, { params, headers: this.getAuthHeaders() });
      })
    );
  }

  // Récupérer les commandes d'un utilisateur par statut
  getOrdersByStatus(status: CartStatus = CartStatus.VALIDEE): Observable<CartItemDto[]> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        let params = new HttpParams()
          .set('userId', userId.toString())
          .set('status', status.toString());
        return this.http.get<CartItemDto[]>(`${this.apiUrl}/orders`, { params, headers: this.getAuthHeaders() });
      })
    );
  }

  // Annuler une commande
  cancelOrder(cartItemId: number): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (userId === 0) {
          throw new Error('Utilisateur non connecté ou ID non disponible');
        }
        let params = new HttpParams().set('userId', userId.toString());
        return this.http.post<void>(`${this.apiUrl}/orders/${cartItemId}/cancel`, null, { params, headers: this.getAuthHeaders() });
      })
    );
  }

  // --- Endpoints Admin ---

  // Récupérer toutes les commandes par statut (admin)
  getAllOrdersByStatus(status: CartStatus = CartStatus.VALIDEE): Observable<CartItemDto[]> {
    let params = new HttpParams().set('status', status.toString());
    return this.http.get<CartItemDto[]>(`${this.apiUrl}/admin/orders`, { params, headers: this.getAuthHeaders() });
  }

  // Mettre à jour le statut d'une commande (admin)
  updateOrderStatus(cartItemId: number, status: CartStatus): Observable<void> {
    let params = new HttpParams().set('status', status.toString());
    return this.http.put<void>(`${this.apiUrl}/admin/orders/${cartItemId}/status`, null, { params, headers: this.getAuthHeaders() });
  }

  // Récupérer les produits avec un stock faible (admin)
  getProductsWithLowStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/admin/lowstock`, { headers: this.getAuthHeaders() });
  }
}