import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found, using test key');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: "2024-06-20",
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Menu routes
  app.get("/api/menu", async (req, res) => {
    try {
      const items = await storage.getAllMenuItems();
      res.json(items);
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

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Mock SMS notification
      console.log(`SMS to ${order.phone}: Your La Charreada order ${order.orderId} has been received! Estimated pickup time: ${order.estimatedTime} minutes.`);
      
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
      
      // Mock SMS notification for status updates
      const statusMessages = {
        'started': `Your La Charreada order ${orderId} is being prepared! It will be ready in about ${order.estimatedTime} minutes.`,
        'completed': `Your La Charreada order ${orderId} is ready for pickup! Thank you for choosing us!`
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
