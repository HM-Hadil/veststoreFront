import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartItem, CartServiceService } from '../../services/cart-service.service';
import { Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  cartCount$: Observable<number>;
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  checkoutSuccess = false;
  checkoutError: string | null = null;
  isLoading = false;
  
  constructor(private cartService: CartServiceService) {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.getCartTotal();
    this.cartCount$ = this.cartService.getCartItemCount();
  }
  
  ngOnInit(): void {
    this.loadCart();
  }
  
  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (items) => {
          this.cartItems = items;
          this.calculateTotal();
        },
        error: (err) => console.error('Erreur lors du chargement du panier', err)
      });
  }

  calculateTotal() {
    this.totalPrice = this.cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  updateQuantity(newQuantity: string | number, cartItemId: number): void {
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;
    if (isNaN(quantity) || quantity < 1) return;
    
    this.isLoading = true;
    this.cartService.updateQuantity(cartItemId, quantity)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => this.calculateTotal(),
        error: (err) => console.error('Erreur lors de la mise à jour de la quantité', err)
      });
  }
  
  incrementQuantity(cartItemId: number, currentQuantity: number): void {
    this.isLoading = true;
    this.cartService.updateQuantity(cartItemId, currentQuantity + 1)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => this.calculateTotal(),
        error: (err) => console.error('Erreur lors de l\'incrémentation de la quantité', err)
      });
  }
  
  decrementQuantity(cartItemId: number, currentQuantity: number): void {
    if (currentQuantity > 1) {
      this.isLoading = true;
      this.cartService.updateQuantity(cartItemId, currentQuantity - 1)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => this.calculateTotal(),
          error: (err) => console.error('Erreur lors de la décrémentation de la quantité', err)
        });
    }
  }

  removeItem(cartItemId: number): void {
    this.isLoading = true;
    this.cartService.removeFromCart(cartItemId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          // Remove the item from local array
          this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
          this.calculateTotal();
        },
        error: (err) => console.error('Erreur lors de la suppression de l\'article', err)
      });
  }
  
  clearCart(): void {
    this.isLoading = true;
    this.cartService.clearCart()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.cartItems = [];
          this.calculateTotal();
        },
        error: (err) => console.error('Erreur lors du vidage du panier', err)
      });
  }
  
  checkout(): void {
    // Réinitialiser les messages
    this.checkoutSuccess = false;
    this.checkoutError = null;
    
    // Vérifier que le panier n'est pas vide
    if (this.cartItems.length === 0) {
      this.checkoutError = 'Le panier est vide. Veuillez ajouter des produits avant de passer commande.';
      return;
    }
    
    // Ici, vous pourriez appeler un service pour traiter la commande
    // this.orderService.placeOrder().subscribe({...});
    
    // Pour cet exemple, nous simulons simplement un succès
    this.isLoading = true;
    setTimeout(() => {
      this.checkoutSuccess = true;
      // Vider le panier après une commande réussie
      this.cartService.clearCart().subscribe(() => {
        this.isLoading = false;
        this.cartItems = [];
        this.calculateTotal();
      });
    }, 1000);
  }
}