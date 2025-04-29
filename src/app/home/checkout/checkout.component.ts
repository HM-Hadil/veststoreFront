import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';
import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Cart, CartServiceService } from '../../services/cart-service.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, NgClass, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
getFieldError(arg0: string) {
throw new Error('Method not implemented.');
}
  cart: Cart = { items: [], totalQuantity: 0, totalPrice: 0 };
  checkoutForm: FormGroup;
  loading = true;
  submitting = false;
  error: string | null = null;
  stockIssue = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private cartService: CartServiceService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.checkoutForm = this.formBuilder.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['France', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
        
        // Vérifier s'il y a des articles dans le panier
        if (cart.items.length === 0) {
          this.router.navigate(['/panier']);
        }
        
        // Vérifier le stock pour tous les articles
        this.checkStock();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du panier. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  checkStock(): void {
    const promises = this.cart.items.map(item => {
      return new Promise<boolean>(resolve => {
        this.cartService.checkProductStock(item.productId, item.quantity).subscribe({
          next: (isAvailable) => {
            if (!isAvailable) {
              this.stockIssue = true;
            }
            resolve(isAvailable);
          },
          error: () => resolve(false)
        });
      });
    });

    Promise.all(promises).then(results => {
      if (results.includes(false)) {
        this.stockIssue = true;
      }
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.checkoutForm.controls).forEach(key => {
        const control = this.checkoutForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    // Vérifier une dernière fois le stock
    this.checkStock();
    if (this.stockIssue) {
      this.error = 'Certains produits ne sont plus en stock. Veuillez retourner à votre panier pour les ajuster.';
      return;
    }
    
    this.submitting = true;
    
    // Formater l'adresse complète
    const formValue = this.checkoutForm.value;
    const shippingAddress = `${formValue.fullName}, ${formValue.address}, ${formValue.postalCode} ${formValue.city}, ${formValue.country}, ${formValue.phone}, ${formValue.email}`;
    
    this.orderService.createOrder(shippingAddress).subscribe({
      next: (order) => {
        this.submitting = false;
        // Rediriger vers la page de confirmation avec l'ID de la commande
        this.router.navigate(['/commandes', order.id]);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Erreur lors de la création de la commande', err);
        this.error = 'Erreur lors de la création de la commande. Veuillez réessayer.';
      }
    });
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const control = this.checkoutForm.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }
  /** 
  getFieldError(fieldName: string): string {
    const control = this.checkoutForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Ce champ est requis';
      }
      if (control.errors['email']) {
        return 'Veuillez entrer une adresse email*/
      }