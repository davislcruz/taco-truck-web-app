import { users, menuItems, orders, categories, settings, type User, type InsertUser, type MenuItem, type InsertMenuItem, type Order, type InsertOrder, type Category, type InsertCategory, type Setting, type InsertSetting } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
import { db } from "./db";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: InsertCategory): Promise<Category | null>;
  deleteCategory(id: number): Promise<boolean>;

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

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentMenuItemId: number;
  private currentOrderId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentMenuItemId = 1;
    this.currentOrderId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with default data
    this.initializeCategories();
    this.initializeMenuItems();
    this.initializeDefaultAdmin();
    this.ensureAllCategoriesHaveItems();
  }

  private initializeCategories() {
    const defaultCategories: Omit<Category, 'id'>[] = [
      { name: "tacos", translation: "Tacos", icon: "utensils", order: 1 },
      { name: "burritos", translation: "Burritos", icon: "utensils", order: 2 },
      { name: "tortas", translation: "Tortas", icon: "utensils", order: 3 },
      { name: "semitas", translation: "Semitas", icon: "utensils", order: 4 },
      { name: "drinks", translation: "Bebidas", icon: "glass-water", order: 5 },
    ];

    defaultCategories.forEach((categoryData, index) => {
      const category: Category = { ...categoryData, id: this.currentCategoryId++ };
      this.categories.set(category.id, category);
    });
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
        ingredients: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime"],
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
        ingredients: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime", "Guacamole (+$2)"],
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
        ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Tomatoes"],
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
        ingredients: ["French Fries", "Cheese", "Sour Cream", "Guacamole", "Pico de Gallo"],
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
        ingredients: ["Beans", "Pickled Onions", "Avocado", "Lettuce", "Tomato", "Spicy Red Sauce"],
        sizes: null
      },
      {
        name: "Semita Tradicional",
        translation: "Traditional Semita",
        category: "semitas",
        price: "9.99",
        description: "Mexican-style sandwich with your choice of meat and ingredients",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        meats: ["Pollo", "Carnitas", "Al Pastor"],
        ingredients: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"],
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
        ingredients: null,
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
        ingredients: null,
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
    // Create default owner user: admin/admin123
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    const defaultAdmin = {
      id: this.currentUserId++,
      username: "admin",
      password: hashedPassword,
      role: "owner" as const
    };
    this.users.set(defaultAdmin.id, defaultAdmin);
  }

  private ensureAllCategoriesHaveItems() {
    const categories = Array.from(this.categories.values());
    const menuItems = Array.from(this.menuItems.values());
    
    for (const category of categories) {
      const itemsInCategory = menuItems.filter(item => item.category === category.name);
      
      if (itemsInCategory.length === 0) {
        // Create a placeholder item for this category
        const placeholderItem: MenuItem = {
          id: this.currentMenuItemId++,
          name: "New Item",
          translation: "Click to edit",
          category: category.name,
          price: "0.00",
          description: "Add description here",
          image: "",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: []
        };
        
        this.menuItems.set(placeholderItem.id, placeholderItem);
      }
    }
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
    const user: User = { ...insertUser, id, role: insertUser.role || "employee" };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...data, id, order: data.order || 0 };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, data: InsertCategory): Promise<Category | null> {
    const category = this.categories.get(id);
    if (!category) return null;
    const updatedCategory = { ...category, ...data };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const category = this.categories.get(id);
    if (!category) return false;

    // Check if any menu items use this category
    const itemsInCategory = Array.from(this.menuItems.values()).filter(
      (item) => item.category === category.name
    );

    if (itemsInCategory.length > 0) {
      // Don't allow deletion if items exist in this category
      throw new Error(`Cannot delete category "${category.translation}" because it contains ${itemsInCategory.length} menu item(s). Please move or delete these items first.`);
    }

    return this.categories.delete(id);
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
    const newItem: MenuItem = {
      id: this.currentMenuItemId++,
      ...data,
      image: data.image || null,
      description: data.description || null,
      sizes: data.sizes || null,
      meats: data.meats || null,
      ingredients: data.ingredients || null
    };
    this.menuItems.set(newItem.id, newItem);
    return newItem;
  }

  async updateMenuItem(id: number, data: InsertMenuItem): Promise<MenuItem | null> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return null;
    const updatedMenuItem: MenuItem = {
      ...menuItem,
      ...data,
      image: data.image || null,
      description: data.description || null,
      sizes: data.sizes || null,
      meats: data.meats || null,
      ingredients: data.ingredients || null
    };
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
      status: insertOrder.status || "received",
      instructions: insertOrder.instructions || null,
      estimatedTime: insertOrder.estimatedTime || null,
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

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    // Check if admin user exists
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      // Create default admin user
      const hashedPassword = await this.hashPassword("admin123");
      await this.createUser({
        username: "admin",
        password: hashedPassword,
        role: "owner"
      });
    }

    // Check if categories exist
    const existingCategories = await this.getAllCategories();
    if (existingCategories.length === 0) {
      // Create default categories
      const defaultCategories = [
        { name: "tacos", translation: "Tacos", icon: "utensils", order: 0 },
        { name: "burritos", translation: "Burritos", icon: "utensils", order: 1 },
        { name: "tortas", translation: "Tortas", icon: "utensils", order: 2 },
        { name: "semitas", translation: "Semitas", icon: "utensils", order: 3 },
        { name: "bebidas", translation: "Bebidas", icon: "glass-water", order: 4 }
      ];

      for (const category of defaultCategories) {
        await this.createCategory(category);
      }

      // Create default menu items for each category
      const defaultMenuItems = [
        // TACOS (4 items)
        {
          name: "De Carnitas",
          translation: "Pulled Pork Tacos",
          category: "tacos",
          price: "12.99",
          description: "Three soft corn tortillas with slow-cooked pulled pork",
          image: "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Carnitas", "Al Pastor", "Carne Asada", "Pollo"],
          ingredients: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime"],
          sizes: []
        },
        {
          name: "De Al Pastor",
          translation: "Al Pastor Tacos",
          category: "tacos",
          price: "13.99",
          description: "Three soft corn tortillas with marinated pork, pineapple, and onions",
          image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Al Pastor", "Carne Asada", "Carnitas", "Pollo"],
          ingredients: ["Cebolla (Onions)", "Cilantro", "Piña (Pineapple)", "Salsa Verde", "Salsa Roja", "Lime"],
          sizes: []
        },
        {
          name: "De Pescado",
          translation: "Fish Tacos",
          category: "tacos",
          price: "14.99",
          description: "Three soft flour tortillas with grilled tilapia and cabbage slaw",
          image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Pescado (Fish)", "Camarón (Shrimp)"],
          ingredients: ["Cabbage Slaw", "Pico de Gallo", "Crema", "Lime", "Chipotle Mayo"],
          sizes: []
        },
        {
          name: "De Chorizo",
          translation: "Chorizo Tacos",
          category: "tacos",
          price: "13.49",
          description: "Three soft corn tortillas with spicy Mexican sausage",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Chorizo", "Al Pastor", "Carnitas"],
          ingredients: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime", "Queso Fresco"],
          sizes: []
        },

        // BURRITOS (4 items)
        {
          name: "De Pollo",
          translation: "Chicken Burrito",
          category: "burritos",
          price: "11.99",
          description: "Large flour tortilla with seasoned chicken, rice, and beans",
          image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Pollo", "Carnitas", "Carne Asada", "Al Pastor"],
          ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Tomatoes"],
          sizes: []
        },
        {
          name: "Burrito de Carne Asada",
          translation: "Grilled Beef Burrito",
          category: "burritos",
          price: "13.99",
          description: "Large flour tortilla with marinated grilled beef, rice, beans, and fresh ingredients",
          image: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Carne Asada", "Al Pastor", "Carnitas", "Pollo"],
          ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Pico de Gallo"],
          sizes: []
        },
        {
          name: "Burrito de Carnitas",
          translation: "Pulled Pork Burrito",
          category: "burritos",
          price: "12.99",
          description: "Large flour tortilla with slow-cooked pulled pork and traditional sides",
          image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Carnitas", "Al Pastor", "Carne Asada", "Pollo"],
          ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Cilantro", "Onions"],
          sizes: []
        },
        {
          name: "Burrito Vegetariano",
          translation: "Vegetarian Burrito",
          category: "burritos",
          price: "10.99",
          description: "Large flour tortilla packed with rice, beans, vegetables, and cheese",
          image: "https://images.unsplash.com/photo-1574343635717-1348761c0d64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Tomatoes", "Bell Peppers", "Onions"],
          sizes: []
        },

        // TORTAS (4 items)
        {
          name: "Torta Ahogada",
          translation: "Drowned Sandwich",
          category: "tortas",
          price: "10.99",
          description: "Traditional Mexican sandwich drowned in spicy red sauce",
          image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Carnitas", "Pollo", "Carne Asada"],
          ingredients: ["Beans", "Pickled Onions", "Avocado", "Lettuce", "Tomato", "Spicy Red Sauce"],
          sizes: []
        },
        {
          name: "Torta de Milanesa",
          translation: "Breaded Steak Sandwich",
          category: "tortas",
          price: "12.99",
          description: "Mexican sandwich with breaded and fried steak on fresh bolillo bread",
          image: "https://images.unsplash.com/photo-1619740455993-8c2b8078c3cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Milanesa (Breaded Steak)", "Carnitas", "Pollo"],
          ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Jalapeños", "Mayo", "Oaxaca Cheese"],
          sizes: []
        },
        {
          name: "Torta de Pollo",
          translation: "Chicken Sandwich",
          category: "tortas",
          price: "11.99",
          description: "Mexican sandwich with seasoned grilled chicken and fresh toppings",
          image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Pollo", "Carnitas", "Al Pastor"],
          ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Onions", "Mayo", "Chipotle Mayo (+$0.50)"],
          sizes: []
        },
        {
          name: "Torta Cubana",
          translation: "Cuban Style Sandwich",
          category: "tortas",
          price: "14.99",
          description: "Loaded Mexican sandwich with multiple meats and all the fixings",
          image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Carnitas", "Chorizo", "Milanesa", "Ham"],
          ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Jalapeños", "Mayo", "Oaxaca Cheese", "Chipotle Mayo"],
          sizes: []
        },

        // SEMITAS (4 items)
        {
          name: "Semita Tradicional",
          translation: "Traditional Semita",
          category: "semitas",
          price: "9.99",
          description: "Mexican-style sandwich with your choice of meat and ingredients",
          image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Pollo", "Carnitas", "Al Pastor"],
          ingredients: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"],
          sizes: []
        },
        {
          name: "Semita de Al Pastor",
          translation: "Al Pastor Semita",
          category: "semitas",
          price: "10.99",
          description: "Mexican-style sandwich with marinated pork and pineapple",
          image: "https://images.unsplash.com/photo-1615870216519-2f9fa2adf101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Al Pastor", "Carnitas", "Pollo"],
          ingredients: ["Beans", "Avocado", "Pineapple", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"],
          sizes: []
        },
        {
          name: "Semita de Carnitas",
          translation: "Pulled Pork Semita",
          category: "semitas",
          price: "10.49",
          description: "Mexican-style sandwich with slow-cooked pulled pork",
          image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Carnitas", "Al Pastor", "Pollo"],
          ingredients: ["Beans", "Avocado", "Pickled Onions", "Lettuce", "Tomato", "Mayo", "Salsa Verde"],
          sizes: []
        },
        {
          name: "Semita de Chorizo",
          translation: "Chorizo Semita",
          category: "semitas",
          price: "10.99",
          description: "Mexican-style sandwich with spicy chorizo sausage",
          image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: ["Chorizo", "Al Pastor", "Carnitas"],
          ingredients: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo", "Queso Fresco"],
          sizes: []
        },

        // BEBIDAS (5 items)
        {
          name: "Agua de Jamaica",
          translation: "Hibiscus Water",
          category: "bebidas",
          price: "3.99",
          description: "Refreshing hibiscus flower drink",
          image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: ["Small", "Medium", "Large"]
        },
        {
          name: "Agua de Tamarindo",
          translation: "Tamarind Water",
          category: "bebidas",
          price: "4.49",
          description: "Sweet and tangy tamarind flavored refreshing drink",
          image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: ["Small", "Medium", "Large"]
        },
        {
          name: "Horchata",
          translation: "Rice Cinnamon Drink",
          category: "bebidas",
          price: "4.99",
          description: "Creamy rice and cinnamon beverage, a Mexican favorite",
          image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: ["Small", "Medium", "Large"]
        },
        {
          name: "Coca-Cola Mexicana",
          translation: "Mexican Coca-Cola",
          category: "bebidas",
          price: "3.49",
          description: "Authentic Mexican Coca-Cola made with cane sugar in glass bottles",
          image: "https://images.unsplash.com/photo-1561758033-48d52648ae8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: ["Bottle"]
        },
        {
          name: "Agua de Limón",
          translation: "Fresh Limeade",
          category: "bebidas",
          price: "4.29",
          description: "Fresh squeezed lime water with a touch of sweetness",
          image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: ["Small", "Medium", "Large"]
        }
      ];

      for (const item of defaultMenuItems) {
        await this.createMenuItem(item);
      }
    }

    // Ensure every category has at least one placeholder item
    await this.ensureAllCategoriesHaveItems();
  }

  private async ensureAllCategoriesHaveItems() {
    const categories = await this.getAllCategories();
    const menuItems = await this.getAllMenuItems();
    
    for (const category of categories) {
      const itemsInCategory = menuItems.filter(item => item.category === category.name);
      
      if (itemsInCategory.length === 0) {
        // Create a placeholder item for this category
        const placeholderItem = {
          name: "New Item",
          translation: "Click to edit",
          category: category.name,
          price: "0.00",
          description: "Add description here",
          image: "",
          availability: true,
          customizable: true,
          meats: [],
          ingredients: [],
          sizes: []
        };
        
        await this.createMenuItem(placeholderItem);
      }
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${hashedPassword.toString('hex')}`;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.order);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(data)
      .returning();
    return category;
  }

  async updateCategory(id: number, data: InsertCategory): Promise<Category | null> {
    const [category] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return category || null;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.category, category));
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item || undefined;
  }

  async createMenuItem(data: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db
      .insert(menuItems)
      .values(data)
      .returning();
    return item;
  }

  async updateMenuItem(id: number, data: InsertMenuItem): Promise<MenuItem | null> {
    const [item] = await db
      .update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning();
    return item || null;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    return order || undefined;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.orderId, orderId))
      .returning();
    return order || undefined;
  }

  async searchOrdersByPhone(phone: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.phone, phone));
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    // Try to update first
    const [updated] = await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
    
    if (updated) {
      return updated;
    }
    
    // If no rows updated, insert new setting
    const [created] = await db
      .insert(settings)
      .values({ key, value })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();