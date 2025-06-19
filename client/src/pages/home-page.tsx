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
      <section className="relative bg-gradient-to-br from-amber-900 via-red-800 to-orange-900 text-white py-8 overflow-hidden">
        {/* Papel Picado Banner */}
        <div className="absolute top-0 left-0 w-full h-8 opacity-80">
          <div className="w-full h-full bg-gradient-to-r from-pink-500 via-red-500 via-yellow-400 via-lime-500 via-green-600 via-teal-500 via-blue-500 via-indigo-500 to-purple-500"></div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="none">
            <path d="M0,0 L20,0 L25,8 L30,0 L50,0 L55,8 L60,0 L80,0 L85,8 L90,0 L110,0 L115,8 L120,0 L140,0 L145,8 L150,0 L170,0 L175,8 L180,0 L200,0 L205,8 L210,0 L230,0 L235,8 L240,0 L260,0 L265,8 L270,0 L290,0 L295,8 L300,0 L320,0 L325,8 L330,0 L350,0 L355,8 L360,0 L380,0 L385,8 L390,0 L400,0 L400,32 L0,32 Z" fill="black" fill-opacity="0.3"/>
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
                <span className="text-2xl mr-3">🚚</span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  ¡Abierto Ahora! • Fresh Daily
                </span>
              </div>
              
              {/* Decorative Border */}
              <div className="border-l-4 border-yellow-400 pl-4 mb-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 font-serif">
                  La Charreada
                  <span className="block text-yellow-300 text-2xl md:text-3xl">Comida Auténtica</span>
                </h2>
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
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-green-800/40 to-green-900/40 backdrop-blur-sm rounded-lg p-4 text-center border border-green-400/30 relative">
                  <div className="text-3xl mb-2">🌮</div>
                  <div className="text-xs text-green-200">Listo en</div>
                  <div className="font-bold text-green-100">10-15 min</div>
                  {/* Small decorative dots */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-800/40 to-pink-900/40 backdrop-blur-sm rounded-lg p-4 text-center border border-pink-400/30 relative">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-xs text-pink-200">Favorito</div>
                  <div className="font-bold text-pink-100">Local</div>
                  {/* Small decorative dots */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-pink-400 rounded-full"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-pink-400 rounded-full"></div>
                </div>
              </div>
              
              {/* Traditional Mexican Quote */}
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/20">
                <p className="text-yellow-200 text-sm italic text-center">
                  "La comida es el corazón de la cultura"
                </p>
                <p className="text-yellow-300/70 text-xs text-center mt-1">
                  Food is the heart of culture
                </p>
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
