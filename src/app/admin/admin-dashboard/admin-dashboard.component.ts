import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category, CategoryService } from '../../services/category.service';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {

  categoryForm: FormGroup;
  productForm: FormGroup;
  categories: Category[] = [];
  products: Product[] = [];
  totalProducts: number = 0;
  totalCategories: number = 0;
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private productService: ProductService
  ) {
    this.categoryForm = this.fb.group({
      id: [null],
      name: ['', Validators.required]
    });

    this.productForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: [''],
      size: ['', Validators.required],
      color: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe(data => this.categories = data);
  }

  loadProducts() {
    this.productService.getProducts().subscribe(data => this.products = data);
  }

  submitCategory() {
    if (this.categoryForm.value.id) {
      this.categoryService.update(this.categoryForm.value.id, this.categoryForm.value)
        .subscribe(() => this.loadCategories());
    } else {
      this.categoryService.create(this.categoryForm.value)
        .subscribe(() => this.loadCategories());
    }
    this.categoryForm.reset();
  }

  submitProduct() {
    if (this.productForm.value.id) {
      this.productService.updateProduct(this.productForm.value.id, this.productForm.value)
        .subscribe(() => this.loadProducts());
    } else {
      this.productService.createProduct(this.productForm.value)
        .subscribe(() => this.loadProducts());
    }
    this.productForm.reset();
  }

  editCategory(category: Category) {
    this.categoryForm.patchValue(category);
  }

  editProduct(product: Product) {
    this.productForm.patchValue(product);
  }

  deleteCategory(id: number) {
    this.categoryService.delete(id).subscribe(() => this.loadCategories());
  }

  deleteProduct(id: number) {
    this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
  }
}
