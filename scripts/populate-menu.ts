#!/usr/bin/env tsx
import { db } from "../server/db";
import { menuItems, type InsertMenuItem } from "../shared/schema";
import { eq } from "drizzle-orm";

const newMenuItems: InsertMenuItem[] = [
  // TACOS (3 more items)
  {
    name: "De Al Pastor",
    translation: "Al Pastor Tacos",
    category: "tacos",
    price: "13.99",
    description: "Three soft corn tortillas with marinated pork, pineapple, and onions",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Al Pastor", "Carne Asada", "Carnitas", "Pollo"],
    ingredients: ["Cebolla (Onions)", "Cilantro", "Piña (Pineapple)", "Salsa Verde", "Salsa Roja", "Lime"],
    sizes: null
  },
  {
    name: "De Pescado",
    translation: "Fish Tacos",
    category: "tacos",
    price: "14.99",
    description: "Three soft flour tortillas with grilled tilapia and cabbage slaw",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Pescado (Fish)", "Camarón (Shrimp)"],
    ingredients: ["Cabbage Slaw", "Pico de Gallo", "Crema", "Lime", "Chipotle Mayo"],
    sizes: null
  },
  {
    name: "De Chorizo",
    translation: "Chorizo Tacos",
    category: "tacos",
    price: "13.49",
    description: "Three soft corn tortillas with spicy Mexican sausage",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Chorizo", "Al Pastor", "Carnitas"],
    ingredients: ["Cebolla (Onions)", "Cilantro", "Salsa Verde", "Salsa Roja", "Lime", "Queso Fresco"],
    sizes: null
  },

  // BURRITOS (3 more items)
  {
    name: "Burrito de Carne Asada",
    translation: "Grilled Beef Burrito",
    category: "burritos",
    price: "13.99",
    description: "Large flour tortilla with marinated grilled beef, rice, beans, and fresh ingredients",
    image: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Carne Asada", "Al Pastor", "Carnitas", "Pollo"],
    ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Pico de Gallo"],
    sizes: null
  },
  {
    name: "Burrito de Carnitas",
    translation: "Pulled Pork Burrito",
    category: "burritos",
    price: "12.99",
    description: "Large flour tortilla with slow-cooked pulled pork and traditional sides",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Carnitas", "Al Pastor", "Carne Asada", "Pollo"],
    ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Cilantro", "Onions"],
    sizes: null
  },
  {
    name: "Burrito Vegetariano",
    translation: "Vegetarian Burrito",
    category: "burritos",
    price: "10.99",
    description: "Large flour tortilla packed with rice, beans, vegetables, and cheese",
    image: "https://images.unsplash.com/photo-1574343635717-1348761c0d64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: null,
    ingredients: ["Rice", "Black Beans", "Pinto Beans", "Cheese", "Sour Cream (+$1)", "Guacamole (+$2)", "Lettuce", "Tomatoes", "Bell Peppers", "Onions"],
    sizes: null
  },

  // TORTAS (3 more items)
  {
    name: "Torta de Milanesa",
    translation: "Breaded Steak Sandwich",
    category: "tortas",
    price: "12.99",
    description: "Mexican sandwich with breaded and fried steak on fresh bolillo bread",
    image: "https://images.unsplash.com/photo-1619740455993-8c2b8078c3cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Milanesa (Breaded Steak)", "Carnitas", "Pollo"],
    ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Jalapeños", "Mayo", "Oaxaca Cheese"],
    sizes: null
  },
  {
    name: "Torta de Pollo",
    translation: "Chicken Sandwich",
    category: "tortas",
    price: "11.99",
    description: "Mexican sandwich with seasoned grilled chicken and fresh toppings",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Pollo", "Carnitas", "Al Pastor"],
    ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Onions", "Mayo", "Chipotle Mayo (+$0.50)"],
    sizes: null
  },
  {
    name: "Torta Cubana",
    translation: "Cuban Style Sandwich",
    category: "tortas",
    price: "14.99",
    description: "Loaded Mexican sandwich with multiple meats and all the fixings",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Carnitas", "Chorizo", "Milanesa", "Ham"],
    ingredients: ["Beans", "Avocado", "Lettuce", "Tomato", "Pickled Jalapeños", "Mayo", "Oaxaca Cheese", "Chipotle Mayo"],
    sizes: null
  },

  // SEMITAS (3 more items)
  {
    name: "Semita de Al Pastor",
    translation: "Al Pastor Semita",
    category: "semitas",
    price: "10.99",
    description: "Mexican-style sandwich with marinated pork and pineapple",
    image: "https://images.unsplash.com/photo-1615870216519-2f9fa2adf101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Al Pastor", "Carnitas", "Pollo"],
    ingredients: ["Beans", "Avocado", "Pineapple", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo"],
    sizes: null
  },
  {
    name: "Semita de Carnitas",
    translation: "Pulled Pork Semita",
    category: "semitas",
    price: "10.49",
    description: "Mexican-style sandwich with slow-cooked pulled pork",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Carnitas", "Al Pastor", "Pollo"],
    ingredients: ["Beans", "Avocado", "Pickled Onions", "Lettuce", "Tomato", "Mayo", "Salsa Verde"],
    sizes: null
  },
  {
    name: "Semita de Chorizo",
    translation: "Chorizo Semita",
    category: "semitas",
    price: "10.99",
    description: "Mexican-style sandwich with spicy chorizo sausage",
    image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: ["Chorizo", "Al Pastor", "Carnitas"],
    ingredients: ["Beans", "Avocado", "Pickled Jalapeños", "Lettuce", "Tomato", "Mayo", "Queso Fresco"],
    sizes: null
  },

  // BEBIDAS (3 more items)
  {
    name: "Agua de Tamarindo",
    translation: "Tamarind Water",
    category: "bebidas",
    price: "4.49",
    description: "Sweet and tangy tamarind flavored refreshing drink",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: null,
    ingredients: null,
    sizes: ["Small", "Medium", "Large"]
  },
  {
    name: "Agua de Horchata",
    translation: "Horchata",
    category: "bebidas",
    price: "4.99",
    description: "Creamy rice and cinnamon beverage, a Mexican favorite",
    image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: null,
    ingredients: null,
    sizes: ["Small", "Medium", "Large"]
  },
  {
    name: "Coca-Cola Mexicana",
    translation: "Mexican Coca-Cola",
    category: "bebidas",
    price: "3.49",
    description: "Authentic Mexican Coca-Cola made with cane sugar in glass bottles",
    image: "https://images.unsplash.com/photo-1561758033-48d52648ae8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: null,
    ingredients: null,
    sizes: ["Bottle"]
  },
  {
    name: "Agua de Limón",
    translation: "Fresh Limeade",
    category: "bebidas",
    price: "4.29",
    description: "Fresh squeezed lime water with a touch of sweetness",
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    meats: null,
    ingredients: null,
    sizes: ["Small", "Medium", "Large"]
  }
];

async function populateMenu() {
  console.log("🌮 Starting menu population...");
  
  try {
    // First, let's see what items already exist
    const existingItems = await db.select().from(menuItems);
    console.log(`📊 Found ${existingItems.length} existing menu items`);
    
    // Group existing items by category
    const itemsByCategory = existingItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log("📋 Current items per category:");
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      console.log(`  - ${category}: ${items.length} items`);
    });
    
    // Insert new items
    let addedCount = 0;
    for (const item of newMenuItems) {
      try {
        const [insertedItem] = await db
          .insert(menuItems)
          .values(item)
          .returning();
        
        console.log(`✅ Added: ${insertedItem.name} (${insertedItem.category})`);
        addedCount++;
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Skipped: ${item.name} (already exists)`);
        } else {
          console.error(`❌ Error adding ${item.name}:`, error.message);
        }
      }
    }
    
    // Show final stats
    const finalItems = await db.select().from(menuItems);
    const finalItemsByCategory = finalItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log("\n🎉 Menu population complete!");
    console.log(`📊 Added ${addedCount} new items`);
    console.log(`📊 Total items: ${finalItems.length}`);
    console.log("\n📋 Final items per category:");
    Object.entries(finalItemsByCategory).forEach(([category, items]) => {
      console.log(`  - ${category}: ${items.length} items`);
    });
    
  } catch (error) {
    console.error("❌ Error populating menu:", error);
    process.exit(1);
  }
}

// Run the script
populateMenu()
  .then(() => {
    console.log("✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });