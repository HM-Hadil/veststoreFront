
import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cart, CartItem, CartServiceService } from '../../services/cart-service.service';
@Component({
  selector: 'app-cart',
  imports: [ NgClass, FormsModule, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

  cart: Cart = { items: [], totalQuantity: 0, totalPrice: 0 };
  loading = false;
  error: string | null = null;
  stockWarnings: { [key: number]: string } = {};
Object: any;

  constructor(
    private cartService: CartServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
        this.checkStock();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du panier. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }
    
    // Vérification du stock avant mise à jour
    this.cartService.checkProductStock(item.productId, newQuantity).subscribe({
      next: (isAvailable) => {
        if (isAvailable) {
          this.stockWarnings[item.id!] = '';
          this.cartService.updateCartItem(item.id!, newQuantity).subscribe({
            error: (err) => {
              console.error('Erreur lors de la mise à jour du panier', err);
              this.error = 'Erreur lors de la mise à jour du panier';
            }
          });
        } else {
          this.stockWarnings[item.id!] = `Stock insuffisant (${item.product.stock} disponible)`;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la vérification du stock', err);
      }
    });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeCartItem(item.id!).subscribe({
      next: () => {
        delete this.stockWarnings[item.id!];
      },
      error: (err) => {
        console.error('Erreur lors de la suppression de l\'article', err);
        this.error = 'Erreur lors de la suppression de l\'article';
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.stockWarnings = {};
      },
      error: (err) => {
        console.error('Erreur lors de la vidange du panier', err);
        this.error = 'Erreur lors de la vidange du panier';
      }
    });
  }

  checkout(): void {
    // Vérification finale du stock avant validation
    this.checkStock(true).then(allAvailable => {
      if (allAvailable) {
        this.router.navigate(['/checkout']);
      }
    });
  }

  private checkStock(navigateOnSuccess: boolean = false): Promise<boolean> {
    this.stockWarnings = {};
    const promises = this.cart.items.map(item => {
      return new Promise<boolean>(resolve => {
        this.cartService.checkProductStock(item.productId, item.quantity).subscribe({
          next: (isAvailable) => {
            if (!isAvailable) {
              this.stockWarnings[item.id!] = `Stock insuffisant (${item.product.stock} disponible)`;
            }
            resolve(isAvailable);
          },
          error: () => resolve(false)
        });
      });
    });

    return Promise.all(promises).then(results => !results.includes(false));
  }
}