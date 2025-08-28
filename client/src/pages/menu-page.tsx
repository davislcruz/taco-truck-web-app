import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Menu, Phone, MapPin, Home, ChefHat, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
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
  selectedToppings?: string[];
  quantity: number;
  totalPrice: number;
}

export default function MenuPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { restaurantName } = useBranding();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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
      <div className="bg-base-100 border-b-2 border-primary shadow-lg fixed top-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-accent-content" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content drop-shadow-sm">{restaurantName}</h1>
                <p className="text-sm text-base-content/90">Authentic Mexican Food Truck</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleOwnerAccess}
                className="bg-base-content/10 hover:bg-base-content/20 text-base-content border-base-content/30 hover:border-base-content/50 backdrop-blur"
              >
                <User className="h-4 w-4 mr-2" />
                Access
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(true)}
                className="bg-secondary hover:bg-secondary text-secondary-content border-secondary hover:border-secondary backdrop-blur relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-content text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
      <div className="fixed bottom-0 left-0 right-0 bg-neutral border-t border-base-200 shadow-lg z-50">
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <button
            onClick={() => setLocation('/')}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-neutral-content hover:text-accent hover:bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={scrollToMenu}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-accent bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
          
          <button
            onClick={() => window.open('tel:+1234567890')}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-neutral-content hover:text-accent hover:bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <Phone className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Call</span>
          </button>
          
          <button
            onClick={() => {
              const locationElement = document.querySelector('[data-location]');
              if (locationElement) {
                locationElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-neutral-content hover:text-accent hover:bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <MapPin className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Location</span>
          </button>
        </div>
      </div>
    </>
  );
}