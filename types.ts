
export enum Category {
  ALL = 'All',
  CLOTHES = 'Clothes',
  ART = 'Art',
  MISC = 'Miscellaneous Products',
  ACCESSORIES = 'Accessories'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: Category;
  description: string;
  detailedHistory: string;
  imageUrl: string;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer';
export type CardProvider = 'visa' | 'mastercard' | 'amex' | null;

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  duties: number;
  total: number;
  shippingDetails: ShippingDetails;
  paymentMethod: PaymentMethod;
  cardProvider?: CardProvider; // Optional, only for cards
  language: string; // To know which language the user ordered in
  status: 'pending' | 'shipped';
}

export type LanguageCode = 'en' | 'am' | 'om' | 'ti' | 'fr' | 'nl' | 'it' | 'de' | 'es';
