import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertOrderSchema, insertMenuItemSchema, insertCategorySchema, insertSettingSchema } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found, using test key');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: "2024-06-20",
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Test route to verify API is working
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Protected category management routes (owner only)
  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      
      // Create a placeholder item for the new category
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
      
      await storage.createMenuItem(placeholderItem);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Menu routes
  app.get("/api/menu", async (req, res) => {
    try {
      const items = await storage.getAllMenuItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Protected menu management routes (owner only)
  app.post("/api/menu", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/menu/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.updateMenuItem(id, menuItemData);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/menu/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id);
      if (!success) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/menu/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getMenuItemsByCategory(category);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/menu-item/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getMenuItemById(id);
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Demo menu population endpoint (temporary - for demos only)
  app.post("/api/menu/populate-demo", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Clear existing items first
      const existingItems = await storage.getAllMenuItems();
      for (const item of existingItems) {
        await storage.deleteMenuItem(item.id);
      }

      // Create demo menu items
      const demoItems = [
        // TACOS
        { name: "De Carnitas", translation: "Pulled Pork Tacos", category: "tacos", price: "12.99", description: "Three soft corn tortillas with slow-cooked pulled pork", image: "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carnitas", "Al Pastor", "Carne Asada", "Pollo"], ingredients: ["Cebolla", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime"], sizes: [] },
        { name: "De Al Pastor", translation: "Al Pastor Tacos", category: "tacos", price: "13.99", description: "Three soft corn tortillas with marinated pork and pineapple", image: "https://images.unsplash.com/photo-1565299585323-38174c4a6471?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Al Pastor", "Carnitas", "Carne Asada", "Pollo"], ingredients: ["Pineapple", "Cebolla", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime"], sizes: [] },
        { name: "De Carne Asada", translation: "Grilled Beef Tacos", category: "tacos", price: "14.99", description: "Three soft corn tortillas with perfectly grilled beef", image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carne Asada", "Al Pastor", "Carnitas", "Pollo"], ingredients: ["Guacamole (+$1)", "Cebolla", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime"], sizes: [] },
        { name: "De Pollo", translation: "Chicken Tacos", category: "tacos", price: "11.99", description: "Three soft corn tortillas with seasoned grilled chicken", image: "https://images.unsplash.com/photo-1559847844-d98b5eb2f6ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Pollo", "Al Pastor", "Carnitas", "Carne Asada"], ingredients: ["Cebolla", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime", "Avocado (+$1)"], sizes: [] },
        
        // BURRITOS
        { name: "Burrito de Carne Asada", translation: "Grilled Beef Burrito", category: "burritos", price: "13.99", description: "Large flour tortilla with marinated grilled beef, rice, beans, and fresh ingredients", image: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carne Asada", "Al Pastor", "Carnitas", "Pollo"], ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Pico de Gallo"], sizes: [] },
        { name: "Burrito de Carnitas", translation: "Pulled Pork Burrito", category: "burritos", price: "12.99", description: "Large flour tortilla with slow-cooked pulled pork and traditional sides", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carnitas", "Al Pastor", "Carne Asada", "Pollo"], ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Cilantro", "Onions"], sizes: [] },
        { name: "Burrito Vegetariano", translation: "Vegetarian Burrito", category: "burritos", price: "10.99", description: "Large flour tortilla packed with rice, beans, vegetables, and cheese", image: "https://images.unsplash.com/photo-1574343635717-1348761c0d64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: [], ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Tomatoes", "Bell Peppers", "Onions"], sizes: [] },
        { name: "Burrito de Al Pastor", translation: "Al Pastor Burrito", category: "burritos", price: "13.49", description: "Large flour tortilla with marinated pork, pineapple, and authentic Mexican flavors", image: "https://images.unsplash.com/photo-1605513169214-fb6e95b33c23?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Al Pastor", "Carnitas", "Carne Asada", "Pollo"], ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Pineapple", "Cilantro", "Onions", "Salsa Verde"], sizes: [] },
        
        // TORTAS
        { name: "Torta Ahogada", translation: "Drowned Sandwich", category: "tortas", price: "10.99", description: "Traditional Mexican sandwich drowned in spicy red sauce", image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carnitas", "Pollo", "Carne Asada"], ingredients: ["Beans", "Pickled Onions", "Avocado", "Lettuce", "Tomato", "Spicy Red Sauce"], sizes: [] },
        { name: "Torta de Milanesa", translation: "Breaded Steak Sandwich", category: "tortas", price: "12.99", description: "Mexican sandwich with breaded and fried steak on fresh bolillo bread", image: "https://images.unsplash.com/photo-1619740455993-8c2b8078c3cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Milanesa", "Carnitas", "Pollo"], ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Jalapeños", "Mayo", "Oaxaca Cheese"], sizes: [] },
        { name: "Torta de Pollo", translation: "Chicken Sandwich", category: "tortas", price: "11.99", description: "Mexican sandwich with seasoned grilled chicken and fresh toppings", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Pollo", "Carnitas", "Al Pastor"], ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Onions", "Mayo", "Chipotle Mayo (+$0.50)"], sizes: [] },
        { name: "Torta Cubana", translation: "Cuban Style Sandwich", category: "tortas", price: "14.99", description: "Loaded Mexican sandwich with multiple meats and all the fixings", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carnitas", "Chorizo", "Milanesa", "Ham"], ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Jalapeños", "Mayo", "Oaxaca Cheese", "Chipotle Mayo"], sizes: [] },
        
        // SEMITAS
        { name: "Semita Tradicional", translation: "Traditional Semita", category: "semitas", price: "9.99", description: "Mexican-style sandwich with your choice of meat and ingredients", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Pollo", "Carnitas", "Al Pastor"], ingredients: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"], sizes: [] },
        { name: "Semita de Al Pastor", translation: "Al Pastor Semita", category: "semitas", price: "10.99", description: "Mexican-style sandwich with marinated pork and pineapple", image: "https://images.unsplash.com/photo-1615870216519-2f9fa2adf101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Al Pastor", "Carnitas", "Pollo"], ingredients: ["Beans", "Avocado", "Pineapple", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"], sizes: [] },
        { name: "Semita de Carnitas", translation: "Pulled Pork Semita", category: "semitas", price: "10.49", description: "Mexican-style sandwich with slow-cooked pulled pork", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Carnitas", "Al Pastor", "Pollo"], ingredients: ["Beans", "Avocado", "Pickled Onions", "Lettuce", "Tomato", "Mayo", "Salsa Verde"], sizes: [] },
        { name: "Semita de Chorizo", translation: "Chorizo Semita", category: "semitas", price: "10.99", description: "Mexican-style sandwich with spicy chorizo sausage", image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: ["Chorizo", "Al Pastor", "Carnitas"], ingredients: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo", "Queso Fresco"], sizes: [] },
        
        // BEBIDAS
        { name: "Agua de Jamaica", translation: "Hibiscus Water", category: "bebidas", price: "3.99", description: "Refreshing hibiscus flower drink", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: [], ingredients: [], sizes: ["Small", "Medium", "Large"] },
        { name: "Agua de Tamarindo", translation: "Tamarind Water", category: "bebidas", price: "4.49", description: "Sweet and tangy tamarind flavored refreshing drink", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: [], ingredients: [], sizes: ["Small", "Medium", "Large"] },
        { name: "Horchata", translation: "Rice Cinnamon Drink", category: "bebidas", price: "4.99", description: "Creamy rice and cinnamon beverage, a Mexican favorite", image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: [], ingredients: [], sizes: ["Small", "Medium", "Large"] },
        { name: "Coca-Cola Mexicana", translation: "Mexican Coca-Cola", category: "bebidas", price: "3.49", description: "Authentic Mexican Coca-Cola made with cane sugar in glass bottles", image: "https://images.unsplash.com/photo-1561758033-48d52648ae8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: [], ingredients: [], sizes: ["Bottle"] },
        { name: "Agua de Limón", translation: "Fresh Limeade", category: "bebidas", price: "4.29", description: "Fresh squeezed lime water with a touch of sweetness", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", availability: true, customizable: true, meats: [], ingredients: [], sizes: ["Small", "Medium", "Large"] }
      ];

      const createdItems = [];
      for (const item of demoItems) {
        const createdItem = await storage.createMenuItem(item);
        createdItems.push(createdItem);
      }

      res.status(201).json({ 
        message: "Demo menu populated successfully!", 
        itemsCreated: createdItems.length 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings/Branding endpoints
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        // Return default branding if not set
        if (req.params.key === 'restaurant_name') {
          return res.json({ key: 'restaurant_name', value: 'La Charreada' });
        }
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { value } = req.body;
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const setting = await storage.updateSetting(req.params.key, value);
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Get restaurant name for SMS notification
      const restaurantSetting = await storage.getSetting('restaurant_name');
      const restaurantName = restaurantSetting?.value || 'La Charreada';
      
      // Mock SMS notification
      console.log(`SMS to ${order.phone}: Your ${restaurantName} order ${order.orderId} has been received! Estimated pickup time: ${order.estimatedTime} minutes.`);
      
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/orders/:orderId/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get restaurant name for SMS notifications
      const restaurantSetting = await storage.getSetting('restaurant_name');
      const restaurantName = restaurantSetting?.value || 'La Charreada';
      
      // Mock SMS notification for status updates
      const statusMessages = {
        'started': `Your ${restaurantName} order ${orderId} is being prepared! It will be ready in about ${order.estimatedTime} minutes.`,
        'completed': `Your ${restaurantName} order ${orderId} is ready for pickup! Thank you for choosing us!`
      };
      
      if (statusMessages[status as keyof typeof statusMessages]) {
        console.log(`SMS to ${order.phone}: ${statusMessages[status as keyof typeof statusMessages]}`);
      }
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/search", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { phone } = req.query;
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Phone number required" });
      }
      
      const orders = await storage.searchOrdersByPhone(phone);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment route
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key') {
        // Mock payment intent for development
        res.json({ 
          clientSecret: "pi_mock_client_secret_123",
          message: "Mock payment - no real charges will be made"
        });
        return;
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
