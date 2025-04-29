import { Component, OnInit } from '@angular/core';
import { Order, OrderService, OrderStatus } from '../../services/order.service';
import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-list',
  imports: [NgClass, CurrencyPipe, DatePipe],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent {

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  error: string | null = null;
  currentFilter: string = 'ALL';
  
  // Enum pour faciliter l'utilisation dans le template
  OrderStatus = OrderStatus;

  // Statuts disponibles pour le filtrage
  statusFilters = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'En attente', value: OrderStatus.PENDING },
    { label: 'Validées', value: OrderStatus.VALIDATED },
    { label: 'Expédiées', value: OrderStatus.SHIPPED },
    { label: 'Livrées', value: OrderStatus.DELIVERED },
    { label: 'Annulées', value: OrderStatus.CANCELLED }
  ];

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getUserOrders().subscribe({
      next: (data) => {
        this.orders = data.map(order => ({
          ...order,
          canCancel: this.orderService.canOrderBeCancelled(order)
        }));
        this.filterOrders();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des commandes. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterOrders(): void {
    if (this.currentFilter === 'ALL') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.currentFilter);
    }
  }

  setStatusFilter(status: string): void {
    this.currentFilter = status;
    this.filterOrders();
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/commandes', orderId]);
  }

  cancelOrder(orderId: number, event: Event): void {
    event.stopPropagation(); // Empêche la navigation vers les détails lors du clic
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (err) => {
          console.error('Erreur lors de l\'annulation de la commande', err);
          this.error = 'Erreur lors de l\'annulation de la commande';
        }
      });
    }
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.VALIDATED:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'En attente';
      case OrderStatus.VALIDATED:
        return 'Validée';
      case OrderStatus.SHIPPED:
        return 'Expédiée';
      case OrderStatus.DELIVERED:
        return 'Livrée';
      case OrderStatus.CANCELLED:
        return 'Annulée';
      default:
        return status;
    }
  }
}