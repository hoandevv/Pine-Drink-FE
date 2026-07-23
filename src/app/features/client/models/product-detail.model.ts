import { ProductVariant } from '../../products/models/product-variant.model';

export interface SizeOption {
  id: string;
  label: string;
  priceModifier: number;
  finalPrice?: number;
  variant?: ProductVariant;
}

export interface LevelOption {
  value: number;
  label: string;
}
