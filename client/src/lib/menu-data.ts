import { MenuItem } from "@shared/schema";
import { 
  Utensils, 
  WrapText, 
  Sandwich, 
  Cookie, 
  Coffee,
  Beef,
  GlassWater,
  LucideIcon
} from "lucide-react";

// Icon mapping for category icons
export const getCategoryIcon = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    "utensils": Utensils,
    "wrap-text": WrapText,
    "beef": Beef,
    "sandwich": Sandwich,
    "cookie": Cookie,
    "coffee": Coffee,
    "glass-water": GlassWater,
  };
  return iconMap[iconName] || Utensils;
};

export const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
};

export const calculateExtraCost = (ingredients: string[]): number => {
  return ingredients.reduce((total, ingredient) => {
    const match = ingredient.match(/\(\+\$(\d+)\)/);
    return match ? total + parseFloat(match[1]) : total;
  }, 0);
};
