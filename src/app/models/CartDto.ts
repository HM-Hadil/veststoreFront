import { CartItemDto } from "./CartItemDto";

export interface CartDto {
    id?: number;
    userId: number;
    items: CartItemDto[];
    totalAmount?: number;
  }