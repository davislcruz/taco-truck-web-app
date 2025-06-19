import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { MenuItem } from "@shared/schema";
import MenuSection from "@/components/menu-section";
import ItemCustomizationModal from "@/components/item-customization-modal";
import CartDrawer from "@/components/cart-drawer";
import OwnerDashboard from "@/components/owner-dashboard";
import { useLocation } from "wouter";

export interface CartItem extends MenuItem {
  cartId: string;
  selectedMeat?: string;
  selectedToppings: string[];
  selectedSize?: string;
  quantity: number;
  totalPrice: number;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showOwnerDashboard, setShowOwnerDashboard] = useState(false);

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
    setSelectedItem(null);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateCartItemQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.cartId === cartId 
        ? { ...item, quantity, totalPrice: (item.totalPrice / item.quantity) * quantity }
        : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOwnerAccess = () => {
    if (user) {
      setShowOwnerDashboard(true);
    } else {
      setLocation('/auth');
    }
  };

  const handleCheckout = () => {
    setLocation('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mexican-red rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🌶️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold dark-gray">La Charreada</h1>
                <p className="text-xs text-gray-500">Authentic Mexican Food Truck</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOwnerAccess}
                className="text-gray-600 hover:text-primary"
              >
                <ShieldX className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-mexican-red hover:bg-red-600 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-warm-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">🌮</div>
          <div className="absolute top-20 right-20 text-4xl">🌶️</div>
          <div className="absolute bottom-10 left-1/4 text-5xl">🥑</div>
          <div className="absolute bottom-20 right-1/3 text-3xl">🫔</div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Main Message */}
            <div>
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">🚚</span>
                <span className="bg-warm-orange px-3 py-1 rounded-full text-sm font-medium">
                  Now Open • Fresh Daily
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Authentic Mexican
                <span className="block text-warm-orange">Food Truck</span>
              </h2>
              <p className="text-red-100 mb-6 text-lg">
                Hand-crafted tacos, burritos & more. Made fresh to order with traditional recipes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={scrollToMenu}
                  className="bg-warm-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full"
                >
                  Order Now
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-red-700 py-3 px-6 rounded-full"
                  onClick={() => window.open('tel:+1234567890')}
                >
                  Call (123) 456-7890
                </Button>
              </div>
            </div>

            {/* Right: Quick Info */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <span className="text-xl mr-2">📍</span>
                  Find Us Today
                </h3>
                <p className="text-red-100 text-sm mb-2">Downtown Plaza</p>
                <p className="text-red-100 text-sm">Mon-Sat: 11AM-8PM</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-xs text-red-100">Ready in</div>
                  <div className="font-bold">10-15 min</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs text-red-100">Customer</div>
                  <div className="font-bold">Favorite</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <MenuSection
        menuItems={menuItems || []}
        onItemSelect={setSelectedItem}
        cart={cart}
      />

      {/* Modals */}
      {selectedItem && (
        <ItemCustomizationModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartItemQuantity}
        onCheckout={handleCheckout}
        total={cartTotal}
      />

      {showOwnerDashboard && user && (
        <OwnerDashboard
          onClose={() => setShowOwnerDashboard(false)}
        />
      )}
    </>
  );
}
