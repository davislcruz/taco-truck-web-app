
import { useState } from "react";
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

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const handlePrevItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: prev[category] === 0 || prev[category] === undefined 
        ? filteredItems.length - 1 
        : prev[category] - 1
    }));
  };

  const handleNextItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: prev[category] === filteredItems.length - 1 || prev[category] === undefined
        ? 0 
        : (prev[category] || 0) + 1
    }));
  };

  const setItemIndex = (category: string, index: number) => {
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: index
    }));
  };

  return (
    <section id="menu-section" className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 dark-gray">
          Our Menu / Nuestro Menú
        </h3>

        {/* All Category Carousels */}
        <div className="space-y-12">
          {categories.map((category) => {
            const filteredItems = menuItems.filter(item => item.category === category);
            const currentItemIndex = currentItemIndexes[category] || 0;
            const currentItem = filteredItems[currentItemIndex];

            if (!currentItem) return null;

            return (
              <div key={category} className="max-w-2xl mx-auto">
                {/* Category Title */}
                <h2 className="text-3xl font-bold text-center my-0 text-red-600">
                  {categoryLabels[category] || category}
                </h2>

                {categoryTaglines[category] && (
                  <div className="text-xs text-green-600 text-center my-0 mb-4">
                    {categoryTaglines[category]}
                  </div>
                )}
                
                <div className="relative mx-1">
                  <Card 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => onItemSelect(currentItem)}
                  >
                    <CardContent className="p-0 flex flex-col xxs:flex-row relative">
                      <Badge variant="secondary" className="absolute top-2 right-2 mexican-red text-white text-sm px-3 py-1 z-10">
                        ${parseFloat(currentItem.price).toFixed(2)}
                      </Badge>
                      
                      {/* Image section - shows on top for mobile, left side for larger screens */}
                      <div className="w-full xxs:w-1/2 xxs:order-1 relative">
                        <div className="aspect-[4/3] xxs:aspect-square relative">
                          <img 
                            src={currentItem.image || "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                            alt={currentItem.name}
                            className="w-full h-full object-cover rounded-t-lg xxs:rounded-t-none xxs:rounded-l-lg"
                          />
                        </div>
                      </div>

                      {/* Content section - shows below image on mobile, right side for larger screens */}
                      <div className="flex-1 xxs:order-2 p-6 xxs:pl-4 flex flex-col relative">
                        <div className="mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg dark-gray mb-1">
                              {currentItem.name}
                            </h4>
                            <div className="text-sm text-gray-600 mb-2">{currentItem.translation}</div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 mb-4 flex-grow">
                          {currentItem.description}
                        </div>

                        {/* Badge-style Add button - visible on xxs and xs screens */}
                        <Button 
                          size="sm"
                          className="hidden xxs:block sm:hidden absolute bottom-2 right-2 bg-mexican-red hover:bg-red-600 text-white text-sm px-3 py-1 z-10 h-auto rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemSelect(currentItem);
                          }}
                        >
                          Add
                        </Button>

                        <Button 
                          size="lg"
                          className="xxs:hidden sm:block bg-mexican-red hover:bg-red-600 text-white px-6 mt-auto"
                        >
                          Customize & Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation Arrows */}
                  {filteredItems.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevItem(category);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextItem(category);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Item Counter and Dots */}
                {filteredItems.length > 1 && (
                  <div className="flex items-center justify-center mt-6 space-x-4">
                    <span className="text-sm text-gray-500">
                      {currentItemIndex + 1} of {filteredItems.length}
                    </span>
                    <div className="flex space-x-2">
                      {filteredItems.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentItemIndex 
                              ? 'bg-mexican-red' 
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          onClick={() => setItemIndex(category, index)}
                        />
                      ))}
                    </div>
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
