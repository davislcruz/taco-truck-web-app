import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";
import { CartItem } from "@/pages/home-page";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (cartId: string) => void;
  onUpdateQuantity: (cartId: string, quantity: number) => void;
  onCheckout: () => void;
  total: number;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  total,
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute right-0 top-0 h-full bg-white w-full max-w-md shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-bold dark-gray flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Your Order
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <p className="text-gray-400 text-sm">Add some delicious items from our menu!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.cartId} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <img 
                          src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.translation}</p>
                            {item.selectedMeat && (
                              <p className="text-xs text-gray-400">
                                {item.selectedMeat}
                              </p>
                            )}
                            {item.selectedSize && (
                              <p className="text-xs text-gray-400">
                                Size: {item.selectedSize}
                              </p>
                            )}
                            {item.selectedToppings.length > 0 && (
                              <p className="text-xs text-gray-400">
                                + {item.selectedToppings.slice(0, 2).join(", ")}
                                {item.selectedToppings.length > 2 && "..."}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-sm">${item.totalPrice.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveItem(item.cartId)}
                                className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold mexican-red">${total.toFixed(2)}</span>
              </div>
              <Button
                onClick={onCheckout}
                className="w-full bg-mexican-red hover:bg-red-600 text-white font-semibold py-3"
                size="lg"
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
