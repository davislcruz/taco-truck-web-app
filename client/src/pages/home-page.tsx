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
      <header className="bg-white shadow-sm fixed top-0 w-full z-40 border-b border-gray-100">
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
      <section className="relative bg-gradient-to-br from-amber-900 via-red-800 to-orange-900 text-white py-8 overflow-hidden mt-24">
        {/* Papel Picado Banner */}
        <div className="fixed top-16 left-0 w-full h-8 overflow-hidden z-30">
          <svg className="w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="none">
            {/* Top banner string */}
            <rect x="0" y="0" width="400" height="3" fill="#8b5cf6" opacity="0.8"/>
            
            {/* Individual colored triangular cut-outs */}
            <polygon points="0,3 7,3 3.5,9" fill="#ec4899" />
            <polygon points="7,3 14,3 10.5,9" fill="#ef4444" />
            <polygon points="14,3 21,3 17.5,9" fill="#facc15" />
            <polygon points="21,3 28,3 24.5,9" fill="#84cc16" />
            <polygon points="28,3 35,3 31.5,9" fill="#16a34a" />
            <polygon points="35,3 42,3 38.5,9" fill="#14b8a6" />
            <polygon points="42,3 49,3 45.5,9" fill="#3b82f6" />
            <polygon points="49,3 56,3 52.5,9" fill="#10b981" />
            <polygon points="56,3 63,3 59.5,9" fill="#06b6d4" />
            <polygon points="63,3 70,3 66.5,9" fill="#6366f1" />
            <polygon points="70,3 77,3 73.5,9" fill="#a855f7" />
            <polygon points="77,3 84,3 80.5,9" fill="#f59e0b" />
            <polygon points="84,3 91,3 87.5,9" fill="#22c55e" />
            <polygon points="91,3 98,3 94.5,9" fill="#e11d48" />
            <polygon points="98,3 105,3 101.5,9" fill="#ec4899" />
            <polygon points="105,3 112,3 108.5,9" fill="#ef4444" />
            <polygon points="112,3 119,3 115.5,9" fill="#facc15" />
            <polygon points="119,3 126,3 122.5,9" fill="#84cc16" />
            <polygon points="126,3 133,3 129.5,9" fill="#16a34a" />
            <polygon points="133,3 140,3 136.5,9" fill="#14b8a6" />
            <polygon points="140,3 147,3 143.5,9" fill="#3b82f6" />
            <polygon points="147,3 154,3 150.5,9" fill="#10b981" />
            <polygon points="154,3 161,3 157.5,9" fill="#06b6d4" />
            <polygon points="161,3 168,3 164.5,9" fill="#6366f1" />
            <polygon points="168,3 175,3 171.5,9" fill="#a855f7" />
            <polygon points="175,3 182,3 178.5,9" fill="#f59e0b" />
            <polygon points="182,3 189,3 185.5,9" fill="#22c55e" />
            <polygon points="189,3 196,3 192.5,9" fill="#e11d48" />
            <polygon points="196,3 203,3 199.5,9" fill="#ec4899" />
            <polygon points="203,3 210,3 206.5,9" fill="#ef4444" />
            <polygon points="210,3 217,3 213.5,9" fill="#facc15" />
            <polygon points="217,3 224,3 220.5,9" fill="#84cc16" />
            <polygon points="224,3 231,3 227.5,9" fill="#16a34a" />
            <polygon points="231,3 238,3 234.5,9" fill="#14b8a6" />
            <polygon points="238,3 245,3 241.5,9" fill="#3b82f6" />
            <polygon points="245,3 252,3 248.5,9" fill="#10b981" />
            <polygon points="252,3 259,3 255.5,9" fill="#06b6d4" />
            <polygon points="259,3 266,3 262.5,9" fill="#6366f1" />
            <polygon points="266,3 273,3 269.5,9" fill="#a855f7" />
            <polygon points="273,3 280,3 276.5,9" fill="#f59e0b" />
            <polygon points="280,3 287,3 283.5,9" fill="#22c55e" />
            <polygon points="287,3 294,3 290.5,9" fill="#e11d48" />
            <polygon points="294,3 301,3 297.5,9" fill="#ec4899" />
            <polygon points="301,3 308,3 304.5,9" fill="#ef4444" />
            <polygon points="308,3 315,3 311.5,9" fill="#facc15" />
            <polygon points="315,3 322,3 318.5,9" fill="#84cc16" />
            <polygon points="322,3 329,3 325.5,9" fill="#16a34a" />
            <polygon points="329,3 336,3 332.5,9" fill="#14b8a6" />
            <polygon points="336,3 343,3 339.5,9" fill="#3b82f6" />
            <polygon points="343,3 350,3 346.5,9" fill="#10b981" />
            <polygon points="350,3 357,3 353.5,9" fill="#06b6d4" />
            <polygon points="357,3 364,3 360.5,9" fill="#6366f1" />
            <polygon points="364,3 371,3 367.5,9" fill="#a855f7" />
            <polygon points="371,3 378,3 374.5,9" fill="#f59e0b" />
            <polygon points="378,3 385,3 381.5,9" fill="#22c55e" />
            <polygon points="385,3 392,3 388.5,9" fill="#e11d48" />
            <polygon points="392,3 400,3 396,9" fill="#ec4899" />
          </svg>
        </div>

        {/* Aztec Geometric Patterns */}
        <div className="absolute inset-0 opacity-15">
          <svg className="absolute top-12 left-8 w-24 h-24 text-amber-400" viewBox="0 0 100 100">
            <path d="M50,10 L70,30 L50,50 L30,30 Z M50,50 L70,70 L50,90 L30,70 Z M10,50 L30,30 L50,50 L30,70 Z M90,50 L70,30 L50,50 L70,70 Z" fill="currentColor"/>
          </svg>
          
          <svg className="absolute top-20 right-12 w-16 h-16 text-orange-400" viewBox="0 0 60 60">
            <path d="M30,5 L35,15 L45,10 L40,20 L50,25 L40,30 L45,40 L35,35 L30,45 L25,35 L15,40 L20,30 L10,25 L20,20 L15,10 L25,15 Z" fill="currentColor"/>
          </svg>

          <svg className="absolute bottom-16 left-1/4 w-20 h-20 text-red-400" viewBox="0 0 80 80">
            <rect x="10" y="10" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
            <rect x="20" y="20" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2"/>
            <rect x="30" y="30" width="20" height="20" fill="currentColor"/>
            <path d="M40,10 L40,0 M10,40 L0,40 M40,70 L40,80 M70,40 L80,40" stroke="currentColor" strokeWidth="2"/>
          </svg>

          <svg className="absolute bottom-20 right-1/3 w-18 h-18 text-yellow-400" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="36" cy="36" r="20" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="36" cy="36" r="10" fill="currentColor"/>
            <path d="M36,6 L36,12 M66,36 L60,36 M36,66 L36,60 M6,36 L12,36 M54.3,17.7 L49.9,22.1 M54.3,54.3 L49.9,49.9 M17.7,54.3 L22.1,49.9 M17.7,17.7 L22.1,22.1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>

        {/* Sugar Skull Accents */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute top-24 right-8 w-12 h-12 text-pink-300" viewBox="0 0 48 48">
            <ellipse cx="24" cy="28" rx="16" ry="18" fill="currentColor"/>
            <circle cx="18" cy="22" r="3" fill="black"/>
            <circle cx="30" cy="22" r="3" fill="black"/>
            <path d="M24,26 L24,32 M21,29 L27,29" stroke="black" strokeWidth="1.5"/>
            <path d="M24,12 C28,12 32,16 32,20 C32,16 28,12 24,12 C20,12 16,16 16,20 C16,16 20,12 24,12" fill="currentColor"/>
          </svg>
          
          <svg className="absolute bottom-12 left-12 w-10 h-10 text-purple-300" viewBox="0 0 40 40">
            <ellipse cx="20" cy="23" rx="13" ry="15" fill="currentColor"/>
            <circle cx="16" cy="19" r="2" fill="black"/>
            <circle cx="24" cy="19" r="2" fill="black"/>
            <path d="M20,22 L20,27 M18,24 L22,24" stroke="black" strokeWidth="1"/>
            <circle cx="20" cy="30" r="1" fill="black"/>
          </svg>
        </div>

        {/* Cactus Silhouettes */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute bottom-0 left-4 w-8 h-16 text-green-400" viewBox="0 0 32 64">
            <path d="M16,64 L16,20 M16,35 L8,35 L8,20 L12,16 L16,20 M16,45 L24,45 L24,30 L28,26 L24,22 L20,26 L20,30" stroke="currentColor" strokeWidth="3" fill="none"/>
            <circle cx="16" cy="20" r="2" fill="currentColor"/>
            <circle cx="8" cy="18" r="1.5" fill="currentColor"/>
            <circle cx="24" cy="28" r="1.5" fill="currentColor"/>
          </svg>
          
          <svg className="absolute bottom-0 right-6 w-6 h-12 text-green-500" viewBox="0 0 24 48">
            <path d="M12,48 L12,15 M12,25 L6,25 L6,15 L8,13 L12,15" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
            <circle cx="6" cy="13" r="1" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Main Message */}
            <div>
              <div className="flex items-center mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  ¡Abierto Ahora! • Fresh Daily
                </span>
              </div>
              
              
              
              <p className="text-amber-100 mb-6 text-lg leading-relaxed">
                Traditional Mexican street food made with authentic recipes passed down through generations. 
                <span className="text-yellow-300 font-medium">¡Sabor verdadero!</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={scrollToMenu}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-xl transform hover:scale-105 transition-all border-2 border-yellow-400"
                >
                  Ver Menú
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black py-3 px-6 rounded-lg font-semibold transition-all"
                  onClick={() => window.open('tel:+1234567890')}
                >
                  📞 (123) 456-7890
                </Button>
              </div>
            </div>

            {/* Right: Traditional Info Cards */}
            <div className="space-y-4">
              {/* Location Card with Aztec Border */}
              <div className="bg-gradient-to-br from-amber-800/40 to-red-900/40 backdrop-blur-sm rounded-lg p-5 border-2 border-yellow-400/30 relative overflow-hidden">
                {/* Decorative Corner Pattern */}
                <svg className="absolute top-0 right-0 w-8 h-8 text-yellow-400/30" viewBox="0 0 32 32">
                  <path d="M0,0 L8,0 L8,8 L16,8 L16,16 L8,16 L8,24 L0,24 L0,16 L8,16 L8,8 L0,8 Z" fill="currentColor"/>
                </svg>
                
                <h3 className="font-bold mb-3 flex items-center text-yellow-300">
                  <span className="text-xl mr-2">📍</span>
                  Ubicación / Location
                </h3>
                <p className="text-amber-100 text-sm mb-2 font-medium">Downtown Plaza</p>
                <p className="text-amber-200 text-sm">Lun-Sáb: 11AM-8PM</p>
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
