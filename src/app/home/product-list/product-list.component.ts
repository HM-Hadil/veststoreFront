import { Component, OnInit } from '@angular/core';
import { Category, CategoryService } from '../../services/category.service';
import { Product, ProductService } from '../../services/product.service';
import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart-service.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [NgClass,FormsModule, CurrencyPipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  uniqueSizes: string[] = [];
  uniqueColors: string[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 9; // Nombre de produits par page
  totalPages = 1;
  
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
    private cartService: CartService,
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
        this.calculateTotalPages();
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
    const sizeSet = new Set<string>();
    this.products.forEach(p => {
      if (p.size && p.size.trim() !== '') {
        sizeSet.add(p.size);
      }
    });
    this.uniqueSizes = Array.from(sizeSet);
      
    // Extraire les couleurs uniques
    const colorSet = new Set<string>();
    this.products.forEach(p => {
      if (p.color && p.color.trim() !== '') {
        colorSet.add(p.color);
      }
    });
    this.uniqueColors = Array.from(colorSet);
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
    
    // Réinitialiser la pagination après application des filtres
    this.currentPage = 1;
    this.calculateTotalPages();
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
    this.currentPage = 1;
    this.calculateTotalPages();
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
    
    this.cartService.addToCart(product).pipe(
      catchError(err => {
        console.error('Erreur lors de l\'ajout au panier', err);
        this.addToCartError[product.id] = err.message || 'Erreur lors de l\'ajout au panier';
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        // Afficher un message de succès temporaire
        this.addToCartSuccess[product.id] = true;
        setTimeout(() => {
          this.addToCartSuccess[product.id] = false;
        }, 3000);
      }
    });
  }
  
  viewCart(): void {
    this.router.navigate(['/cart']);
  }
  
  // Pagination methods
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
  }
  
  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  getPages(): number[] {
    const pages: number[] = [];
    // Afficher au maximum 5 pages
    const maxPages = 5;
    
    if (this.totalPages <= maxPages) {
      // Afficher toutes les pages si le total est inférieur ou égal à maxPages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Afficher les pages autour de la page actuelle
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
      let endPage = startPage + maxPages - 1;
      
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}