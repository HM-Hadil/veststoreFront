import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderService, OrderStatus } from '../../services/order.service';
import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, CurrencyPipe, DatePipe],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  error: string | null = null;
  
  // Enum pour faciliter l'utilisation dans le template
  OrderStatus = OrderStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(parseInt(orderId, 10));
    } else {
      this.error = 'ID de commande non spécifié';
      this.loading = false;
    }
  }

  loadOrder(orderId: number): void {
    this.loading = true;
    this.orderService.getOrderById(orderId).subscribe({
      next: (data) => {
        this.order = {
          ...data,
          canCancel: this.orderService.canOrderBeCancelled(data)
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la commande. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  cancelOrder(): void {
    if (!this.order) return;
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.orderService.cancelOrder(this.order.id).subscribe({
        next: (updatedOrder) => {
          this.order = {
            ...updatedOrder,
            canCancel: this.orderService.canOrderBeCancelled(updatedOrder)
          };
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

  getOrderStatusProgress(): number {
    if (!this.order) return 0;
    
    switch (this.order.status) {
      case OrderStatus.PENDING:
        return 25;
      case OrderStatus.VALIDATED:
        return 50;
      case OrderStatus.SHIPPED:
        return 75;
      case OrderStatus.DELIVERED:
        return 100;
      case OrderStatus.CANCELLED:
        return 0;
      default:
        return 0;
    }
  }

  backToList(): void {
    this.router.navigate(['/commandes']);
  }}