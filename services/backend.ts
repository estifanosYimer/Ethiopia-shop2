
import { Order, Product, Category } from '../types';
import { MOCK_PRODUCTS } from '../constants';

const KEYS = {
  ORDERS: 'ethio_backend_orders',
  PRODUCTS: 'ethio_backend_products',
  AUTH: 'ethio_backend_auth',
  SUBSCRIBERS: 'ethio_backend_subscribers'
};

// Simulate network latency for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class BackendService {
  private products: Product[] = [];
  private orders: Order[] = [];
  private subscribers: string[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Load Products
    const storedProducts = localStorage.getItem(KEYS.PRODUCTS);
    if (storedProducts) {
      this.products = JSON.parse(storedProducts);
    } else {
      // Seed Database with Mock Data if empty
      this.products = [...MOCK_PRODUCTS];
      this.saveProducts();
    }

    // Load Orders
    const storedOrders = localStorage.getItem(KEYS.ORDERS);
    if (storedOrders) {
      this.orders = JSON.parse(storedOrders);
    }

    // Load Subscribers
    const storedSubscribers = localStorage.getItem(KEYS.SUBSCRIBERS);
    if (storedSubscribers) {
      this.subscribers = JSON.parse(storedSubscribers);
    }
  }

  // --- PRODUCT MANAGEMENT ---

  async getProducts(): Promise<Product[]> {
    await delay(300);
    return [...this.products];
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await delay(600);
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    this.products.unshift(newProduct);
    this.saveProducts();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    await delay(500);
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    this.products[index] = { ...this.products[index], ...updates };
    this.saveProducts();
    return this.products[index];
  }

  async deleteProduct(id: string): Promise<void> {
    await delay(400);
    this.products = this.products.filter(p => p.id !== id);
    this.saveProducts();
  }

  private saveProducts() {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(this.products));
  }

  // --- ORDER MANAGEMENT ---

  async createOrder(order: Order): Promise<Order> {
    await delay(1500); // Simulate payment gateway processing
    this.orders.unshift(order);
    this.saveOrders();
    return order;
  }

  async getOrders(): Promise<Order[]> {
    await delay(500);
    return [...this.orders];
  }

  async clearOrders(): Promise<void> {
    await delay(300);
    this.orders = [];
    this.saveOrders();
  }

  private saveOrders() {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(this.orders));
  }

  // --- NEWSLETTER ---

  async addSubscriber(email: string): Promise<void> {
      await delay(500);
      if (!this.subscribers.includes(email)) {
          this.subscribers.unshift(email);
          this.saveSubscribers();
      }
  }

  async getSubscribers(): Promise<string[]> {
      await delay(300);
      return [...this.subscribers];
  }

  private saveSubscribers() {
      localStorage.setItem(KEYS.SUBSCRIBERS, JSON.stringify(this.subscribers));
  }

  // --- AUTHENTICATION ---
  
  async verifyAdminPin(pin: string): Promise<boolean> {
      await delay(400); // Prevent brute force
      return pin === '1234';
  }
}

export const backend = new BackendService();
