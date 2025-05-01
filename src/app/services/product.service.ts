import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductSize } from '../models/ProductSize';

export interface Product {
  id: number;
  name: string;
  description: string;
  size: ProductSize;
  color: string;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl: string;
  lowStockThreshold: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:9094/api/products';
  
  constructor(private http: HttpClient) {}
  
  // Configuration des en-têtes HTTP pour éviter les problèmes d'autorisation
  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
  
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product, this.getHeaders());
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product, this.getHeaders());
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product, this.getHeaders());
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product, this.getHeaders());
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
   // Decrement stock after order validation
   decrementStock(productId: number, quantity: number): Observable<void> {
    const params = new HttpParams()
      .set('quantity', quantity.toString());
    
    return this.http.post<void>(
      `${this.apiUrl}/${productId}/decrement-stock`, 
      null, 
      { 
        headers: this.getAuthHeaders(),
        params: params
      }
    );
  }
  // Get the auth token from localStorage
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

}