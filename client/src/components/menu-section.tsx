import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MenuItem } from "@shared/schema";
import { CartItem } from "@/pages/home-page";
import { Utensils, Coffee, Sandwich, ChevronLeft, ChevronRight } from "lucide-react";

interface MenuSectionProps {
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  cart: CartItem[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  tacos: <Utensils className="h-4 w-4" />,
  burritos: <Utensils className="h-4 w-4" />,
  tortas: <Sandwich className="h-4 w-4" />,
  semitas: <Sandwich className="h-4 w-4" />,
  drinks: <Coffee className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  tacos: "Tacos",
  burritos: "Burritos", 
  tortas: "Tortas",
  semitas: "Semitas",
  drinks: "Bebidas",
};

const categoryTaglines: Record<string, string> = {
  tacos: "CON CEBOLLA Y CILANTRO / WITH ONIONS & CILANTRO",
  burritos: "CON FRIJOLES, ARROS, LECHUGA, QUESO, PICO DE GALLO Y CREMA",
};

export default function MenuSection({ menuItems, onItemSelect, cart }: MenuSectionProps) {
  const [currentItemIndexes, setCurrentItemIndexes] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePrevItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1 || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: prev[category] === 0 || prev[category] === undefined 
        ? filteredItems.length - 1 
        : prev[category] - 1
    }));
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNextItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1 || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: prev[category] === filteredItems.length - 1 || prev[category] === undefined
        ? 0 
        : (prev[category] || 0) + 1
    }));
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const setItemIndex = (category: string, index: number) => {
    const currentIndex = currentItemIndexes[category] || 0;
    if (index === currentIndex || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: index
    }));
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const renderCardContent = (item: MenuItem, category: string) => (
    <Card
      key={item.id}
      className="group cursor-pointer h-full flex flex-col bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg hover:shadow-orange-100"
      onClick={() => onItemSelect(item)}
    >
      <CardContent className="p-0 flex flex-col xs:flex-row relative">
        {/* Image section */}
        <div className="w-full xs:w-1/2 xs:order-1 relative cursor-grab active:cursor-grabbing select-none">
          <div className="aspect-[3/2] xs:aspect-[4/3] relative">
            <img 
              src={item.image || "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
              alt={item.name}
              className="w-full h-full object-cover rounded-t-lg xs:rounded-t-none xs:rounded-l-lg pointer-events-none"
            />
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 xs:order-2 py-2.5 px-2.5 xs:pl-4 flex flex-col relative cursor-grab active:cursor-grabbing select-none">
          <div className="mb-0">
            <div className="flex-1">
              <h4 className="font-bold text-lg dark-gray mb-0">
                {item.name}
              </h4>
              <div className="text-sm text-gray-600 mb-2 mt-0">{item.translation}</div>
            </div>
          </div>

          <div className="text-sm xs:text-xs text-gray-500 mb-4 flex-grow">
            {item.description}
          </div>

          <Button 
            size="lg"
            className="bg-mexican-red hover:bg-red-600 text-white px-6 mt-auto font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onItemSelect(item);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            Customize & Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <section id="menu-section" className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 dark-gray">
          Our Menu / Nuestro Menú
        </h3>

        {/* All Category Carousels */}
        <div className="space-y-6">
          {categories.map((category) => {
            const filteredItems = menuItems.filter(item => item.category === category);
            const currentItemIndex = currentItemIndexes[category] || 0;
            const currentItem = filteredItems[currentItemIndex];
            const hasTagline = categoryTaglines[category];

            if (!currentItem) return null;

            return (
              <div key={category} className="max-w-2xl mx-auto">
                {/* Category Title with Navigation */}
                <div className="relative">
                  <h2 className="text-2xl font-bold text-center my-0 text-red-600">
                    {categoryLabels[category] || category}
                  </h2>
                  {hasTagline && (
                    <p className="text-sm text-gray-600 font-medium text-center mt-2">
                      {hasTagline}
                    </p>
                  )}
                </div>

                {/* Carousel Container */}
                <div className="relative mt-4">
                  <div className="overflow-hidden rounded-lg">
                    <div className="w-full transition-opacity duration-500 ease-in-out">
                      {renderCardContent(currentItem, category)}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  {filteredItems.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border-orange-200 hover:bg-orange-50 hover:border-orange-300 z-10"
                        onClick={() => handlePrevItem(category)}
                        disabled={isAnimating}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border-orange-200 hover:bg-orange-50 hover:border-orange-300 z-10"
                        onClick={() => handleNextItem(category)}
                        disabled={isAnimating}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Navigation Dots */}
                {filteredItems.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {filteredItems.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentItemIndex
                            ? 'bg-red-500 scale-125'
                            : 'bg-red-200 hover:bg-red-300'
                        }`}
                        onClick={() => setItemIndex(category, index)}
                        disabled={isAnimating}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}