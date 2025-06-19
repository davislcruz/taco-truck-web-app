import { MenuItem } from "@shared/schema";

export const menuCategories = [
  { id: "tacos", name: "Tacos", icon: "🌮" },
  { id: "burritos", name: "Burritos", icon: "🌯" },
  { id: "tortas", name: "Tortas", icon: "🥙" },
  { id: "semitas", name: "Semitas", icon: "🥪" },
  { id: "drinks", name: "Bebidas", icon: "🥤" },
];

// This data is now managed by the backend storage layer
// but we can keep this file for type definitions and helpers

export const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
};

export const calculateExtraCost = (toppings: string[]): number => {
  return toppings.reduce((total, topping) => {
    const match = topping.match(/\(\+\$(\d+)\)/);
    return match ? total + parseFloat(match[1]) : total;
  }, 0);
};

export const getCategoryIcon = (category: string): string => {
  const categoryMap: Record<string, string> = {
    tacos: "🌮",
    burritos: "🌯", 
    tortas: "🥙",
    semitas: "🥪",
    drinks: "🥤",
  };
  return categoryMap[category] || "🍽️";
};
