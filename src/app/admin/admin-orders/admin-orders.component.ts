import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs';
import { CartItemDto } from '../../models/CartItemDto';
import { CartStatus } from '../../models/CartStatus';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../services/cart-service.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  // Cartitems statut propriété
  cartItems: CartItemDto[] = [];
  filteredCartItems: CartItemDto[] = [];
  loading = true;
  error: string | null = null;
  
  // Exposer CartStatus à le template
  CartStatus = CartStatus;
  
  // Filtres
  statusFilter = new FormControl('');
  searchFilter = new FormControl('');
  dateFilter = new FormControl('');
  priceMinFilter = new FormControl('');
  priceMaxFilter = new FormControl('');
  
  // Options pour les statuts
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: CartStatus.EN_ATTENTE, label: 'En attente' },
    { value: CartStatus.VALIDEE, label: 'Validée' },
    { value: CartStatus.EXPEDIEE, label: 'Expédiée' },
    { value: CartStatus.LIVREE, label: 'Livrée' },
    { value: CartStatus.ANNULEE, label: 'Annulée' }
  ];
  
  // Pour le tri
  sortField = 'id';
  sortDirection = 'asc';

  constructor(private cartService: CartService) { }

  ngOnInit(): void {
    // Chargement des commandes
    this.loadAllOrders();
    
    // Configurer les filtres réactifs
    this.statusFilter.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
      
    this.searchFilter.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
      
    this.dateFilter.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
      
    this.priceMinFilter.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
      
    this.priceMaxFilter.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
  }

  // Charger toutes les commandes
  loadAllOrders(): void {
    this.loading = true;
    this.error = null;
    
    // Si aucun filtre de statut n'est spécifié, charger tous les ordres
    const selectedStatus = this.statusFilter.value;
    
    if (selectedStatus) {
      this.cartService.getAllOrdersByStatus(selectedStatus as CartStatus)
        .subscribe({
          next: (items) => {
            this.cartItems = items;
            this.filteredCartItems = [...items];
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des commandes', err);
            this.error = 'Impossible de charger les commandes. Veuillez réessayer plus tard.';
            this.loading = false;
          }
        });
    } else {
      // Pour tous les statuts, faire plusieurs appels et combiner les résultats
      // Dans un cas réel, il serait préférable d'avoir une API dédiée côté serveur
      const statuses = [
        CartStatus.EN_ATTENTE,
        CartStatus.VALIDEE,
        CartStatus.EXPEDIEE,
        CartStatus.LIVREE,
        CartStatus.ANNULEE
      ];
      
      // Utilisation de Promise.all avec firstValueFrom pour Angular moderne
      Promise.all(statuses.map(status => 
        firstValueFrom(this.cartService.getAllOrdersByStatus(status))
      ))
      .then(results => {
        // Fusionner les résultats (filtrer les undefined/null pour éviter l'erreur TypeScript)
        this.cartItems = results.flat().filter((item): item is CartItemDto => !!item);
        this.filteredCartItems = [...this.cartItems];
        this.loading = false;
      })
      .catch(err => {
        console.error('Erreur lors du chargement de toutes les commandes', err);
        this.error = 'Impossible de charger les commandes. Veuillez réessayer plus tard.';
        this.loading = false;
      });
    }
  }

  // Mise à jour du statut d'une commande
  updateOrderStatus(itemId: number, newStatus: CartStatus | null): void {
    if (newStatus === null) return; // Ne rien faire si le statut est null
    
    this.loading = true;
    this.cartService.updateOrderStatus(itemId, newStatus)
      .subscribe({
        next: () => {
          // Mettre à jour le statut dans la liste locale
          const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
          if (itemIndex >= 0) {
            this.cartItems[itemIndex] = {
              ...this.cartItems[itemIndex],
              status: newStatus
            };
            this.filteredCartItems = this.applyFiltersToItems(this.cartItems);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du statut', err);
          this.error = 'Impossible de mettre à jour le statut. Veuillez réessayer.';
          this.loading = false;
        }
      });
  }

  // Appliquer les filtres sur les items
  applyFilters(): void {
    this.filteredCartItems = this.applyFiltersToItems(this.cartItems);
  }

  private applyFiltersToItems(items: CartItemDto[]): CartItemDto[] {
    let result = [...items];
    
    // Filtre par statut
    const statusValue = this.statusFilter.value;
    if (statusValue) {
      result = result.filter(item => item.status === statusValue);
    }
    
    // Filtre par recherche (nom du produit)
    const searchValue = this.searchFilter.value?.toLowerCase();
    if (searchValue) {
      result = result.filter(item => 
        item.productName?.toLowerCase().includes(searchValue)
      );
    }
    
    // Filtre par prix minimum
    const minPrice = parseFloat(this.priceMinFilter.value || '0');
    if (minPrice > 0) {
      result = result.filter(item => item.price >= minPrice);
    }
    
    // Filtre par prix maximum
    const maxPrice = parseFloat(this.priceMaxFilter.value || '0');
    if (maxPrice > 0) {
      result = result.filter(item => item.price <= maxPrice);
    }
    
    // Tri des résultats
    result = this.sortItems(result);
    
    return result;
  }

  // Trier les items
  sortItems(items: CartItemDto[]): CartItemDto[] {
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch(this.sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'productName':
          comparison = (a.productName || '').localeCompare(b.productName || '');
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        default:
          comparison = 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Modifier le tri
  setSorting(field: string): void {
    if (this.sortField === field) {
      // Inverser la direction si on clique sur le même champ
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.applyFilters();
  }

  // Vérifier si le changement de statut est autorisé
  canChangeStatus(currentStatus: CartStatus | undefined, newStatus: CartStatus): boolean {
    if (!currentStatus) return false;
    
    // Règles de transitions de statut
    switch(currentStatus) {
      case CartStatus.EN_ATTENTE:
        return newStatus === CartStatus.VALIDEE || newStatus === CartStatus.ANNULEE;
      case CartStatus.VALIDEE:
        return newStatus === CartStatus.EXPEDIEE || newStatus === CartStatus.ANNULEE;
      case CartStatus.EXPEDIEE:
        return newStatus === CartStatus.LIVREE;
      case CartStatus.LIVREE:
        return false; // Statut final
      case CartStatus.ANNULEE:
        return false; // Statut final
      default:
        return false;
    }
  }

  // Obtenir le statut suivant possible
  getNextStatus(currentStatus: CartStatus | undefined): CartStatus | null {
    if (!currentStatus) return null;
    
    switch(currentStatus) {
      case CartStatus.EN_ATTENTE:
        return CartStatus.VALIDEE;
      case CartStatus.VALIDEE:
        return CartStatus.EXPEDIEE;
      case CartStatus.EXPEDIEE:
        return CartStatus.LIVREE;
      default:
        return null;
    }
  }

  // Obtenir la couleur du badge de statut
  getStatusColor(status: CartStatus | undefined): string {
    if (!status) return 'secondary';
    
    switch(status) {
      case CartStatus.EN_ATTENTE:
        return 'warning';
      case CartStatus.VALIDEE:
        return 'info';
      case CartStatus.EXPEDIEE:
        return 'primary';
      case CartStatus.LIVREE:
        return 'success';
      case CartStatus.ANNULEE:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // Réinitialiser tous les filtres
  resetFilters(): void {
    this.statusFilter.setValue('');
    this.searchFilter.setValue('');
    this.dateFilter.setValue('');
    this.priceMinFilter.setValue('');
    this.priceMaxFilter.setValue('');
  }
  
  // Calculer la valeur totale des articles
  getTotalValue(): number {
    return this.filteredCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  // Calculer la valeur moyenne du panier
  getAverageCartValue(): number {
    if (this.filteredCartItems.length === 0) return 0;
    return this.getTotalValue() / this.filteredCartItems.length;
  }
  progressOrder(itemId: number, currentStatus: CartStatus | undefined): void {
    const nextStatus = this.getNextStatus(currentStatus);
    if (nextStatus) {
      this.updateOrderStatus(itemId, nextStatus);
    }}
}