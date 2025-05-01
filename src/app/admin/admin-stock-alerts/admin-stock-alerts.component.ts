import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminOrderService } from '../../services/admin-order.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Interface pour représenter un produit avec niveau de stock
export interface ProductStock {
  id: number;
  name: string;
  category?: string;
  imageUrl?: string;
  currentStock: number;
  alertThreshold: number;
  hasLowStock: boolean;
}

@Component({
  selector: 'app-admin-stock-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-stock-alerts.component.html',
  styleUrls: ['./admin-stock-alerts.component.css']
})
export class AdminStockAlertsComponent implements OnInit, OnDestroy {
  lowStockProducts: ProductStock[] = [];
  loading: boolean = false;
  errorMessage: string | null = null;
  private subscriptions: Subscription = new Subscription();
  private stockApiUrl = '/api/products/stock';
  
  constructor(
    private adminOrderService: AdminOrderService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadLowStockProducts();
  }

  ngOnDestroy(): void {
    // Nettoyage des abonnements pour éviter les fuites mémoire
    this.subscriptions.unsubscribe();
  }
  
  loadLowStockProducts(): void {
    this.loading = true;
    this.errorMessage = null;
    
    const subscription = this.adminOrderService.lowStockAlerts$.subscribe({
      next: (products: ProductStock[]) => {
        this.lowStockProducts = products;
        this.loading = false;
      },
      error: (error) => {
        this.handleError('Erreur lors du chargement des alertes de stock', error);
        this.loading = false;
      }
    });
    
    this.subscriptions.add(subscription);
    
    // Rafraîchir les données
    this.adminOrderService.refreshLowStockAlerts();
  }
  
  /**
   * Réapprovisionne le stock d'un produit
   * @param productId ID du produit à réapprovisionner
   */
  replenishStock(productId: number): void {
    this.loading = true;
    
    // Ouvrir une boîte de dialogue pour saisir la quantité (exemple simplifié)
    const quantity = prompt('Quantité à ajouter au stock:', '10');
    
    if (quantity !== null) {
      const parsedQuantity = parseInt(quantity, 10);
      
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        this.errorMessage = 'Veuillez entrer une quantité valide (nombre positif)';
        this.loading = false;
        return;
      }
      
      // Appel à l'API pour mettre à jour le stock
      const subscription = this.http.post(`${this.stockApiUrl}/${productId}/replenish`, { quantity: parsedQuantity })
        .subscribe({
          next: () => {
            // Rafraîchir les données après réapprovisionnement
            this.adminOrderService.refreshLowStockAlerts();
            this.loading = false;
          },
          error: (error) => {
            this.handleError('Erreur lors du réapprovisionnement du stock', error);
            this.loading = false;
          }
        });
        
      this.subscriptions.add(subscription);
    } else {
      // L'utilisateur a annulé
      this.loading = false;
    }
  }
  
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorMessage = `${message}: ${error.message || 'Une erreur est survenue'}`;
  }
}