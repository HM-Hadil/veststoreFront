import { ProductSize } from "./ProductSize";

export interface ProductDto {
    id?: number;
    name: string;
    description?: string;
    size: ProductSize;
    color: string;
    price: number;
    stock: number;
    categoryId: number;
    imageUrl?: string;
    lowStockThreshold?: number;
  }