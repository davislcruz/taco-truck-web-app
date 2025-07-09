import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus } from "lucide-react";
import { MenuItem } from "@shared/schema";
import { CartItem } from "@/pages/home-page";

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
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState(item.sizes?.[0] || "");

  const calculatePrice = () => {
    let basePrice = parseFloat(item.price);
    let extraCost = 0;

    // Calculate extra costs from toppings
    selectedToppings.forEach(topping => {
      const match = topping.match(/\(\+\$(\d+)\)/);
      if (match) {
        extraCost += parseFloat(match[1]);
      }
    });

    return (basePrice + extraCost) * quantity;
  };

  const handleToppingChange = (topping: string, checked: boolean) => {
    if (checked) {
      setSelectedToppings(prev => [...prev, topping]);
    } else {
      setSelectedToppings(prev => prev.filter(t => t !== topping));
    }
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      ...item,
      cartId: `${item.id}-${Date.now()}-${Math.random()}`,
      selectedMeat,
      selectedToppings,
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

          {/* Toppings Selection */}
          {item.toppings && item.toppings.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Select toppings:</h4>
              <div className="space-y-2">
                {item.toppings.map((topping) => {
                  const isExtra = topping.includes("(+$");
                  return (
                    <div key={topping} className="flex items-center space-x-2">
                      <Checkbox
                        id={topping}
                        checked={selectedToppings.includes(topping)}
                        onCheckedChange={(checked) => 
                          handleToppingChange(topping, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={topping}
                        className={isExtra ? "warm-orange font-medium" : ""}
                      >
                        {topping}
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
