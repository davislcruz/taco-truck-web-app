import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus } from "lucide-react";
import { MenuItem, Category } from "@shared/schema";
import { CartItem } from "@/pages/home-page";

// Define ingredient interface
interface Ingredient {
  id: string;
  name: string;
  isDefault: boolean;
  price: number;
}

interface ItemCustomizationModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export default function ItemCustomizationModal({
  item,
  onClose,
  onAddToCart,
}: ItemCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedMeat, setSelectedMeat] = useState(item.meats?.[0] || "");
  const [selectedIngredientsFallback, setSelectedIngredientsFallback] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState(item.sizes?.[0] || "");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Fetch categories to get ingredients for this item's category
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Find the category and its ingredients
  const categoryData = useMemo(() => {
    return categories.find(cat => cat.name === item.category);
  }, [categories, item.category]);

  const ingredients = useMemo(() => {
    if (!categoryData?.ingredients) return [];
    return categoryData.ingredients as Ingredient[];
  }, [categoryData]);

  // Initialize selected ingredients with default ingredients when ingredients change
  useEffect(() => {
    if (ingredients.length > 0) {
      const defaultIngredients = ingredients
        .filter(ing => ing.isDefault)
        .map(ing => ing.id);
      setSelectedIngredients(defaultIngredients);
    }
  }, [ingredients]);

  const calculatePrice = () => {
    let basePrice = parseFloat(item.price);
    let extraCost = 0;

    // Calculate extra costs from ingredients
    selectedIngredients.forEach(ingredientId => {
      const ingredient = ingredients.find(ing => ing.id === ingredientId);
      if (ingredient && !ingredient.isDefault) {
        extraCost += ingredient.price;
      }
    });

    // Calculate extra costs from old ingredients fallback system
    selectedIngredientsFallback.forEach(ingredient => {
      const match = ingredient.match(/\(\+\$(\d+)\)/);
      if (match) {
        extraCost += parseFloat(match[1]);
      }
    });

    return (basePrice + extraCost) * quantity;
  };

  const handleIngredientFallbackChange = (ingredient: string, checked: boolean) => {
    if (checked) {
      setSelectedIngredientsFallback(prev => [...prev, ingredient]);
    } else {
      setSelectedIngredientsFallback(prev => prev.filter(t => t !== ingredient));
    }
  };

  const handleIngredientChange = (ingredientId: string, checked: boolean) => {
    if (checked) {
      setSelectedIngredients(prev => [...prev, ingredientId]);
    } else {
      setSelectedIngredients(prev => prev.filter(id => id !== ingredientId));
    }
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      ...item,
      cartId: `${item.id}-${Date.now()}-${Math.random()}`,
      selectedMeat,
      selectedIngredients: selectedIngredientsFallback,
      selectedSize,
      quantity,
      totalPrice: calculatePrice(),
    };

    onAddToCart(cartItem);
  };

  const totalPrice = calculatePrice();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-8">
      <Card className="w-full max-w-2xl max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold dark-gray">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.translation}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Item Image and Description */}
          <div>
            <img 
              src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
              alt={item.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <p className="text-gray-600">{item.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-semibold w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Meat Selection */}
          {item.meats && item.meats.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Choose your meat:</h4>
              <RadioGroup value={selectedMeat} onValueChange={setSelectedMeat}>
                {item.meats.map((meat) => (
                  <div key={meat} className="flex items-center space-x-2">
                    <RadioGroupItem value={meat} id={meat} />
                    <Label htmlFor={meat}>{meat}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Size Selection */}
          {item.sizes && item.sizes.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Choose size:</h4>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                {item.sizes.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <RadioGroupItem value={size} id={size} />
                    <Label htmlFor={size}>{size}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Ingredients Selection */}
          {ingredients.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Customize your ingredients:</h4>
              <div className="space-y-2">
                {ingredients.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient.id);
                  const isExtra = !ingredient.isDefault;
                  
                  return (
                    <div key={ingredient.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={ingredient.id}
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleIngredientChange(ingredient.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={ingredient.id}
                          className={isExtra ? "text-orange-600 font-medium" : ""}
                        >
                          {ingredient.name}
                        </Label>
                      </div>
                      <div className="text-sm text-gray-600">
                        {ingredient.isDefault ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <span className="text-orange-600">+${ingredient.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Default ingredients are free. Uncheck to remove them. Extra ingredients have additional charges.
              </div>
            </div>
          )}

          {/* Fallback Ingredients Selection (for items without ingredient system) */}
          {ingredients.length === 0 && item.ingredients && item.ingredients.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Select ingredients:</h4>
              <div className="space-y-2">
                {item.ingredients.map((ingredient) => {
                  const isExtra = ingredient.includes("(+$");
                  return (
                    <div key={ingredient} className="flex items-center space-x-2">
                      <Checkbox
                        id={ingredient}
                        checked={selectedIngredientsFallback.includes(ingredient)}
                        onCheckedChange={(checked) => 
                          handleIngredientFallbackChange(ingredient, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={ingredient}
                        className={isExtra ? "text-orange-600 font-medium" : ""}
                      >
                        {ingredient}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full bg-mexican-red hover:bg-red-600 text-white font-semibold py-4"
            size="lg"
          >
            Add to Cart - ${totalPrice.toFixed(2)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
