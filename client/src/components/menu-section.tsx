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
      <CardContent className="p-0 h-full flex flex-col">
        <AspectRatio ratio={4/3} className="xxs:block xs:block sm:hidden">
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 rounded-t-lg flex items-center justify-center">
            <div className="text-orange-600 text-4xl opacity-20">
              {categoryIcons[category]}
            </div>
          </div>
        </AspectRatio>
        
        <AspectRatio ratio={1} className="hidden sm:block">
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 rounded-t-lg flex items-center justify-center">
            <div className="text-orange-600 text-6xl opacity-20">
              {categoryIcons[category]}
            </div>
          </div>
        </AspectRatio>
        
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {item.name}
              </h3>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                ${item.price}
              </Badge>
            </div>
            
            {item.translation && (
              <p className="text-sm text-gray-600 italic">
                {item.translation}
              </p>
            )}
            
            {item.description && (
              <p className="text-xs text-gray-500 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const filteredItems = menuItems.filter(item => item.category === category);
        const currentIndex = currentItemIndexes[category] || 0;
        const currentItem = filteredItems[currentIndex];
        const hasTagline = categoryTaglines[category];

        if (!currentItem) return null;

        return (
          <section key={category} className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {categoryIcons[category]}
                <h2 className="text-2xl font-bold text-gray-900">
                  {categoryLabels[category]}
                </h2>
              </div>
              {hasTagline && (
                <p className="text-sm text-gray-600 font-medium">
                  {hasTagline}
                </p>
              )}
            </div>
            
            <div className="relative">
              <div className="flex justify-center">
                <div className="w-full max-w-md transition-opacity duration-500 ease-in-out">
                  {renderCardContent(currentItem, category)}
                </div>
              </div>
              
              {filteredItems.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => handlePrevItem(category)}
                    disabled={isAnimating}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => handleNextItem(category)}
                    disabled={isAnimating}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex justify-center mt-4 space-x-2">
                    {filteredItems.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex
                            ? 'bg-orange-500 scale-125'
                            : 'bg-orange-200 hover:bg-orange-300'
                        }`}
                        onClick={() => setItemIndex(category, index)}
                        disabled={isAnimating}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}