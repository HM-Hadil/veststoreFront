import { CartStatus } from "./CartStatus";
import { ProductSize } from "./ProductSize";

export interface CartItemDto {
    id: number;
    productId: number;
    productName?: string;
    quantity: number;
    size: ProductSize;
    color: string;
    price: number; 
    status?: CartStatus;
  }