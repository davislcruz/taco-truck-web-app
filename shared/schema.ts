import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  translation: text("translation").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  image: text("image"),
  meats: text("meats").array(),
  toppings: text("toppings").array(),
  sizes: text("sizes").array(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  phone: text("phone").notNull(),
  items: jsonb("items").notNull(),
  instructions: text("instructions"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("received"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  estimatedTime: integer("estimated_time").default(20),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
