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
    <div className="fixed inset-0 z-50 bg-neutral/60">
      <div className="absolute right-0 top-0 h-full card w-full max-w-md shadow-2xl bg-base-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="card-body flex-row items-center justify-between border-b border-base-200 p-6">
            <h3 className="card-title flex items-center">
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
              <div className="flex flex-col items-center justify-center py-12">
                <div className="avatar mb-4">
                  <div className="w-16 rounded-full bg-base-200 flex items-center justify-center">
                    <ShoppingCart className="h-10 w-10 text-base-content" />
                  </div>
                </div>
                <div className="alert alert-info mb-2">Your cart is empty</div>
                <div className="alert alert-warning">Add some delicious items from our menu!</div>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.cartId} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="avatar">
                          <div className="w-16 rounded-lg">
                            <img 
                              src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                              alt={item.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="card-title text-sm">{item.name}</h4>
                            <p className="text-xs text-base-content/70">{item.translation}</p>
                            {item.selectedMeat && (
                              <p className="text-xs text-base-content/60">
                                {item.selectedMeat}
                              </p>
                            )}
                            {item.selectedSize && (
                              <p className="text-xs text-base-content/60">
                                Size: {item.selectedSize}
                              </p>
                            )}
                            {item.selectedToppings && item.selectedToppings.length > 0 && (
                              <p className="text-xs text-base-content/60">
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
                                className="text-error hover:text-error-content h-6 w-6 p-0"
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
            <div className="card-body border-t border-base-200 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <Button
                onClick={onCheckout}
                className="w-full btn btn-primary font-semibold py-3"
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
