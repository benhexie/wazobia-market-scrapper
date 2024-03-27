export interface ProductVariant {
  weight: string;
  price: number;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  images?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  price?: number;
  description?: string;
  productVariants?: ProductVariant[];
  link: string;
}

export interface Category {
  name: string;
  products?: Product[];
}

export interface ScrapperOutput {
  categories: Category[];
}