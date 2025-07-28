import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ShieldX, Menu, Phone, MapPin, Home, ChefHat, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { MenuItem } from "@shared/schema";
import MenuSection from "@/components/menu-section";
import ItemCustomizationModal from "@/components/item-customization-modal";
import CartDrawer from "@/components/cart-drawer";
import { useLocation } from "wouter";
import { useEffect } from "react";

export interface CartItem extends MenuItem {
  cartId: string;
  selectedMeat?: string;
  selectedIngredients: string[];
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

  // Only redirect owners to dashboard on initial login, not when they explicitly visit homepage
  useEffect(() => {
    if (user && user.role === "owner" && !sessionStorage.getItem("allowOwnerHomepage")) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Clear the flag when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("allowOwnerHomepage");
    };
  }, []);

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
      setLocation('/dashboard');
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
      <header className="bg-white shadow-sm fixed top-0 w-full z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mexican-red rounded-full flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
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
                <User className="h-4 w-4" />
              </Button>

            </div>
          </div>
        </div>
      </header>

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



      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-50">
        <div className="flex items-center justify-around py-3 px-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={scrollToMenu}
            className="flex flex-col items-center justify-center py-3 px-4 min-w-[64px] text-gray-500 hover:text-mexican-red hover:bg-mexican-red/5 transition-all duration-200 rounded-xl"
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => window.open('tel:+1234567890')}
            className="flex flex-col items-center justify-center py-3 px-4 min-w-[64px] text-gray-500 hover:text-mexican-red hover:bg-mexican-red/5 transition-all duration-200 rounded-xl"
          >
            <Phone className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Call</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center justify-center py-3 px-4 min-w-[64px] text-gray-500 hover:text-mexican-red hover:bg-mexican-red/5 transition-all duration-200 rounded-xl"
          >
            <ShoppingCart className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Order</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-mexican-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                {cartItemCount}
              </span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => {
              const locationElement = document.querySelector('[data-location]');
              if (locationElement) {
                locationElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center justify-center py-3 px-4 min-w-[64px] text-gray-500 hover:text-mexican-red hover:bg-mexican-red/5 transition-all duration-200 rounded-xl"
          >
            <MapPin className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Location</span>
          </Button>
        </div>
      </div>
    </>
  );
}
