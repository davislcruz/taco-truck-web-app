import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ShieldX, Menu, Phone, MapPin, Home, ChefHat } from "lucide-react";
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
                <span className="text-lg">👤</span>
              </Button>

            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-900 via-red-800 to-orange-900 text-white py-8 overflow-hidden mt-14">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex justify-center items-center">
            {/* Centered Location Card */}
            <div className="space-y-4 flex flex-col items-center justify-center">
              {/* Location Card with Aztec Border */}
              <div className="bg-gradient-to-br from-amber-800/40 to-red-900/40 backdrop-blur-sm rounded-lg p-5 border-2 border-yellow-400/30 relative overflow-hidden text-center max-w-md w-full" data-location>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 mr-1.5 text-yellow-300" />
                    <span className="text-amber-100 text-sm font-medium"> 
                      <span className="text-base font-bold text-yellow-300">Location: </span>Philadelphia, 4133 G St
                    </span>
                  </div>
                  <span className="text-amber-200 text-sm">Mon-Sat: 11AM-8PM</span>
                </div>
                
                <div className="flex flex-row gap-3 mt-4 justify-center">
                  <Button
                    onClick={scrollToMenu}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-xl transform hover:scale-105 transition-all border-2 border-yellow-400"
                  >
                    Ver Menú
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black py-2 px-4 rounded-lg font-semibold transition-all"
                    onClick={() => window.open('tel:+1234567890')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    (123) 456-7890
                  </Button>
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
