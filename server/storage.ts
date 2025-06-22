import { users, menuItems, orders, type User, type InsertUser, type MenuItem, type InsertMenuItem, type Order, type InsertOrder } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Menu methods
  getAllMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getMenuItemById(id: number): Promise<MenuItem | undefined>;
  createMenuItem(data: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: InsertMenuItem): Promise<MenuItem | null>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByOrderId(orderId: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  searchOrdersByPhone(phone: string): Promise<Order[]>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private currentUserId: number;
  private currentMenuItemId: number;
  private currentOrderId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.currentUserId = 1;
    this.currentMenuItemId = 1;
    this.currentOrderId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with default menu items and admin user
    this.initializeMenuItems();
    this.initializeDefaultAdmin();
  }

  private initializeMenuItems() {
    const defaultMenuItems: Omit<MenuItem, 'id'>[] = [
      {
        name: "De Carnitas",
        translation: "Pulled Pork Tacos",
        category: "tacos",
        price: "12.99",
        description: "Three soft corn tortillas with slow-cooked pulled pork",
        image: "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Carnitas", "Al Pastor", "Carne Asada", "Pollo"],
        toppings: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime"],
        sizes: null
      },
      {
        name: "De Carne Asada",
        translation: "Grilled Beef Tacos",
        category: "tacos",
        price: "13.99",
        description: "Three soft corn tortillas with marinated grilled beef",
        image: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Carne Asada", "Al Pastor", "Carnitas", "Pollo"],
        toppings: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime", "Guacamole (+$2)"],
        sizes: null
      },
      {
        name: "De Pollo",
        translation: "Chicken Burrito",
        category: "burritos",
        price: "11.99",
        description: "Large flour tortilla with seasoned chicken, rice, and beans",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Pollo", "Carnitas", "Carne Asada", "Al Pastor"],
        toppings: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Tomatoes"],
        sizes: null
      },
      {
        name: "Burrito California",
        translation: "California Style Burrito",
        category: "burritos",
        price: "13.99",
        description: "Loaded burrito with french fries and your choice of meat",
        image: "https://images.unsplash.com/photo-1583053542132-b8fb5a768ba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Carne Asada", "Al Pastor", "Carnitas", "Pollo"],
        toppings: ["French Fries", "Cheese", "Sour Cream", "Guacamole", "Pico de Gallo"],
        sizes: null
      },
      {
        name: "Torta Ahogada",
        translation: "Drowned Sandwich",
        category: "tortas",
        price: "10.99",
        description: "Traditional Mexican sandwich drowned in spicy red sauce",
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Carnitas", "Pollo", "Carne Asada"],
        toppings: ["Beans", "Pickled Onions", "Avocado", "Lettuce", "Tomato", "Spicy Red Sauce"],
        sizes: null
      },
      {
        name: "Semita Tradicional",
        translation: "Traditional Semita",
        category: "semitas",
        price: "9.99",
        description: "Mexican-style sandwich with your choice of meat and toppings",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Pollo", "Carnitas", "Al Pastor"],
        toppings: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"],
        sizes: null
      },
      {
        name: "Agua de Jamaica",
        translation: "Hibiscus Water",
        category: "drinks",
        price: "3.99",
        description: "Refreshing hibiscus flower drink",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: null,
        toppings: null,
        sizes: ["Small", "Medium", "Large"]
      },
      {
        name: "Horchata",
        translation: "Rice Cinnamon Drink",
        category: "drinks",
        price: "4.99",
        description: "Creamy rice and cinnamon beverage",
        image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: null,
        toppings: null,
        sizes: ["Small", "Medium", "Large"]
      }
    ];

    defaultMenuItems.forEach(item => {
      const menuItem: MenuItem = {
        id: this.currentMenuItemId++,
        ...item
      };
      this.menuItems.set(menuItem.id, menuItem);
    });
  }

  private async initializeDefaultAdmin() {
    // Create default admin user: admin/admin123
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    const defaultAdmin = {
      id: this.currentUserId++,
      username: "admin",
      password: hashedPassword
    };
    this.users.set(defaultAdmin.id, defaultAdmin);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (item) => item.category === category
    );
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(data: InsertMenuItem): Promise<MenuItem> {
    const newItem = { id: this.currentMenuItemId++, ...data };
    this.menuItems.set(newItem.id, newItem);
    return newItem;
  }

  async updateMenuItem(id: number, data: InsertMenuItem): Promise<MenuItem | null> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return null;
    const updatedMenuItem = { ...menuItem, ...data };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      id,
      ...insertOrder,
      timestamp: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.orderId === orderId
    );
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const order = await this.getOrderByOrderId(orderId);
    if (order) {
      order.status = status;
      this.orders.set(order.id, order);
      return order;
    }
    return undefined;
  }

  async searchOrdersByPhone(phone: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.phone.includes(phone)
    );
  }
}

export const storage = new MemStorage();