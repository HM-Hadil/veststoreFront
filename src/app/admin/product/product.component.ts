import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryService } from '../../services/category.service';
import { Product, ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit {
  // Formulaires
  productForm: FormGroup;
  categoryForm: FormGroup;
  
  // Données
  products: Product[] = [];
  categories: Category[] = [];
  productSizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  // État
  editingProductId: number | null = null;
  editingCategoryId: number | null = null;
  activeTab: 'products' | 'categories' = 'products';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      size: ['', Validators.required],
      color: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      imageUrl: [''],
      lowStockThreshold: [5],
    });
    
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    console.log('Initialisation du composant');
  }

  // Méthodes de gestion des onglets
  setActiveTab(tab: 'products' | 'categories'): void {
    console.log('Changement d\'onglet vers:', tab);
    this.activeTab = tab;
    
    // Rechargement des données lors du changement d'onglet pour s'assurer qu'elles sont à jour
    if (tab === 'products') {
      this.loadProducts();
    } else if (tab === 'categories') {
      this.loadCategories();
    }
  }

  // Méthodes de gestion des produits
  loadProducts(): void {
    console.log('Chargement des produits...');
    this.productService.getProducts().subscribe({
      next: (data) => {
        console.log('Produits chargés:', data.length);
        this.products = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des produits', err);
      }
    });
  }

  onSubmitProduct(): void {
    if (this.productForm.valid) {
      console.log('Soumission du formulaire produit:', this.productForm.value);
      if (this.editingProductId) {
        this.productService.updateProduct(this.editingProductId, this.productForm.value).subscribe({
          next: () => {
            console.log('Produit mis à jour avec succès');
            this.loadProducts();
            this.productForm.reset();
            this.editingProductId = null;
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour du produit', err);
          }
        });
      } else {
        this.productService.createProduct(this.productForm.value).subscribe({
          next: () => {
            console.log('Produit créé avec succès');
            this.loadProducts();
            this.productForm.reset();
          },
          error: (err) => {
            console.error('Erreur lors de la création du produit', err);
          }
        });
      }
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      console.log('Suppression du produit:', id);
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          console.log('Produit supprimé avec succès');
          this.loadProducts();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du produit', err);
        }
      });
    }
  }

  editProduct(product: Product): void {
    console.log('Édition du produit:', product);
    this.editingProductId = product.id;
    this.productForm.patchValue(product);
  }

  cancelEditProduct(): void {
    console.log('Annulation de l\'édition du produit');
    this.editingProductId = null;
    this.productForm.reset();
  }

  // Méthodes de gestion des catégories
  loadCategories(): void {
    console.log('Chargement des catégories...');
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        console.log('Catégories chargées:', data.length, data);
        this.categories = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories', err);
      }
    });
  }

  onSubmitCategory(): void {
    if (this.categoryForm.valid) {
      console.log('Soumission du formulaire catégorie:', this.categoryForm.value);
      if (this.editingCategoryId) {
        this.categoryService.updateCategory(this.editingCategoryId, this.categoryForm.value).subscribe({
          next: () => {
            console.log('Catégorie mise à jour avec succès');
            this.loadCategories();
            this.categoryForm.reset();
            this.editingCategoryId = null;
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour de la catégorie', err);
          }
        });
      } else {
        this.categoryService.createCategory(this.categoryForm.value).subscribe({
          next: () => {
            console.log('Catégorie créée avec succès');
            this.loadCategories();
            this.categoryForm.reset();
          },
          error: (err) => {
            console.error('Erreur lors de la création de la catégorie', err);
          }
        });
      }
    }
  }

  deleteCategory(id: number): void {
    // Vérifier si la catégorie est utilisée par des produits
    const productsWithCategory = this.products.filter(p => p.categoryId === id);
    
    if (productsWithCategory.length > 0) {
      alert('Cette catégorie ne peut pas être supprimée car elle est utilisée par des produits.');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie?')) {
      console.log('Suppression de la catégorie:', id);
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          console.log('Catégorie supprimée avec succès');
          this.loadCategories();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la catégorie', err);
        }
      });
    }
  }

  editCategory(category: Category): void {
    console.log('Édition de la catégorie:', category);
    this.editingCategoryId = category.id;
    this.categoryForm.patchValue(category);
  }

  cancelEditCategory(): void {
    console.log('Annulation de l\'édition de la catégorie');
    this.editingCategoryId = null;
    this.categoryForm.reset();
  }

  // Méthodes utilitaires
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Inconnu';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.productForm.patchValue({
          imageUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  }
}