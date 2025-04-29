import { Component } from '@angular/core';
import { Category, CategoryService } from '../../services/category.service';
import { Product, ProductService } from '../../services/product.service';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartServiceService } from '../../services/cart-service.service';

@Component({
  selector: 'app-product-list',
  imports: [NgClass, FormsModule, CurrencyPipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  uniqueSizes: string[] = [];
  uniqueColors: string[] = [];
  
  filters = {
    categoryId: null as number | null,
    size: '',
    color: '',
    minPrice: null as number | null,
    maxPrice: null as number | null
  };
  
  loading = true;
  error: string | null = null;
  addToCartSuccess: { [key: number]: boolean } = {};
  addToCartError: { [key: number]: string } = {};

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartServiceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
        this.extractUniqueValues();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des produits. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    });
  }

  extractUniqueValues(): void {
    // Extraire les tailles uniques
    this.uniqueSizes = [...new Set(this.products
      .filter(p => p.size)
      .map(p => p.size))];
      
    // Extraire les couleurs uniques
    this.uniqueColors = [...new Set(this.products
      .filter(p => p.color)
      .map(p => p.color))];
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(product => {
      // Filtre par catégorie
      if (this.filters.categoryId && product.categoryId !== this.filters.categoryId) {
        return false;
      }
      
      // Filtre par taille
      if (this.filters.size && product.size !== this.filters.size) {
        return false;
      }
      
      // Filtre par couleur
      if (this.filters.color && product.color !== this.filters.color) {
        return false;
      }
      
      // Filtre par prix minimum
      if (this.filters.minPrice && product.price < this.filters.minPrice) {
        return false;
      }
      
      // Filtre par prix maximum
      if (this.filters.maxPrice && product.price > this.filters.maxPrice) {
        return false;
      }
      
      return true;
    });
  }

  resetFilters(): void {
    this.filters = {
      categoryId: null,
      size: '',
      color: '',
      minPrice: null,
      maxPrice: null
    };
    this.filteredProducts = this.products;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Non catégorisé';
  }
  
  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    
    // Reset des messages
    this.addToCartSuccess[product.id] = false;
    this.addToCartError[product.id] = '';
    
    // Vérification du stock
    if (product.stock <= 0) {
      this.addToCartError[product.id] = 'Produit en rupture de stock';
      return;
    }
    
    this.cartService.addToCart(product, 1).subscribe({
      next: () => {
        // Afficher un message de succès temporaire
        this.addToCartSuccess[product.id] = true;
        setTimeout(() => {
          this.addToCartSuccess[product.id] = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout au panier', err);
        this.addToCartError[product.id] = 'Erreur lors de l\'ajout au panier';
      }
    });
  }
  
  viewCart(): void {
    this.router.navigate(['/panier']);
  }
}