import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { CartItemDto } from '../../models/CartItemDto';
import { CartService } from '../../services/cart-service.service';
import { CartStatus } from '../../models/CartStatus';
import { ProductService } from '../../services/product.service';

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
  CartStatus = CartStatus; // Make enum available in template

  constructor(
    private cartService: CartService,
    private productService: ProductService,
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
    const item = this.cartItems.find(i => i.id === itemId);
    if (!item) return;
  
    // 🚫 Vérification du stock disponible
    if (quantity > item.quantity) {
      alert(`Stock insuffisant pour le produit "${item.productName}". Stock disponible : ${item.Stock}`);
      return;
    }
  
    if (quantity < 1) return;
  
    this.cartService.updateCartItem(itemId, quantity)
      .subscribe({
        next: (cart) => {
          this.cartItems = cart.items || [];
          console.log('Item quantity updated');
        },
        error: (error) => {
          console.error('Error updating quantity:', error);
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

  validateItem(itemId: number): void {
    if (confirm('Êtes-vous sûr de vouloir valider cette commande?')) {
      this.cartService.updateOrderStatus(itemId, CartStatus.VALIDEE)
        .subscribe({
          next: () => {
            console.log('Order validated');
            // Decrease product stock
            this.decrementStock(itemId);
            // Update status in UI
            const item = this.cartItems.find(i => i.id === itemId);
            if (item) {
              item.status = CartStatus.VALIDEE;
            }
          },
          error: (error) => {
            console.error('Error validating order:', error);
            this.loadCartItems();
          }
        });
    }
  }

  cancelItem(itemId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande?')) {
      this.cartService.updateOrderStatus(itemId, CartStatus.ANNULEE)
        .subscribe({
          next: () => {
            console.log('Order cancelled');
            // Update status in UI
            const item = this.cartItems.find(i => i.id === itemId);
            if (item) {
              item.status = CartStatus.ANNULEE;
            }
          },
          error: (error) => {
            console.error('Error cancelling order:', error);
            this.loadCartItems();
          }
        });
    }
  }

  decrementStock(itemId: number): void {
    const item = this.cartItems.find(i => i.id === itemId);
    if (!item) return;

    // Call the product service to decrement stock
    this.productService.decrementStock(item.productId, item.quantity)
      .subscribe({
        next: () => {
          console.log(`Stock decremented for product ${item.productId}`);
        },
        error: (error) => {
          console.error('Error decrementing stock:', error);
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

  getStatusLabel(status: CartStatus | undefined): string {
    if (!status) return 'En attente'; // Default to 'En attente' if status is undefined
    
    switch (status) {
      case CartStatus.EN_ATTENTE:
        return 'En attente';
      case CartStatus.VALIDEE:
        return 'Validée';
    
      case CartStatus.EXPEDIEE:
        return 'Expédiée';
      case CartStatus.LIVREE:
        return 'Livrée';
      case CartStatus.ANNULEE:
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  }

  getStatusClass(status: CartStatus | undefined): string {
    if (!status) return 'status-pending'; // Default to pending class if status is undefined
    
    switch (status) {
      case CartStatus.EN_ATTENTE:
        return 'status-pending';
      case CartStatus.VALIDEE:
        return 'status-validated';
   
      case CartStatus.EXPEDIEE:
        return 'status-shipped';
      case CartStatus.LIVREE:
        return 'status-delivered';
      case CartStatus.ANNULEE:
        return 'status-cancelled';
      default:
        return '';
    }
  }
}