import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { CartItemDto } from '../../models/CartItemDto';
import { CartService } from '../../services/cart-service.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItemDto[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCartItems();
  }

  loadCartItems(): void {
    this.isLoading = true;
    this.cartService.getCart()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (cart) => {
          this.cartItems = cart.items || [];
          console.log('Cart items loaded:', this.cartItems);
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.errorMessage = 'Erreur lors du chargement du panier. Veuillez réessayer.';
        }
      });
  }

  updateItemQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) return;
    
    this.cartService.updateCartItem(itemId, quantity)
      .subscribe({
        next: (cart) => {
          this.cartItems = cart.items || [];
          console.log('Item quantity updated');
        },
        error: (error) => {
          console.error('Error updating quantity:', error);
          // Reload cart to get current state
          this.loadCartItems();
        }
      });
  }

  removeItem(itemId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article du panier?')) {
      this.cartService.removeCartItem(itemId)
        .subscribe({
          next: () => {
            console.log('Item removed');
            this.cartItems = this.cartItems.filter(item => item.id !== itemId);
          },
          error: (error) => {
            console.error('Error removing item:', error);
            this.loadCartItems();
          }
        });
    }
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider votre panier?')) {
      this.cartService.clearCart()
        .subscribe({
          next: () => {
            console.log('Cart cleared');
            this.cartItems = [];
          },
          error: (error) => {
            console.error('Error clearing cart:', error);
          }
        });
    }
  }

  checkout(): void {
    this.cartService.placeOrder()
      .subscribe({
        next: () => {
          console.log('Order placed successfully');
          this.router.navigate(['/orders']);
        },
        error: (error) => {
          console.error('Error placing order:', error);
          this.errorMessage = 'Erreur lors de la commande. Veuillez vérifier votre panier et réessayer.';
        }
      });
  }

  calculateTotal(): number {
    return this.cartItems.reduce((sum, item) => {
      // Vérifie si price est défini, sinon utilise 0
      const price = item.price !== undefined ? item.price : 0;
      return sum + (price * item.quantity);
    }, 0);
  }
}