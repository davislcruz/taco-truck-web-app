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

const categories = ["tacos", "burritos", "tortas", "semitas", "drinks"];

const categoryLabels: Record<string, string> = {
  tacos: "Tacos",
  burritos: "Burritos",
  tortas: "Tortas",
  semitas: "Semitas",
  drinks: "Bebidas / Drinks"
};

const categoryTaglines: Record<string, string> = {
  tacos: "Authentic Mexican street tacos made fresh daily",
  burritos: "Hearty burritos packed with flavor",
  tortas: "Traditional Mexican sandwiches on crusty bread",
  semitas: "Puebla-style sandwiches with avocado and chipotle",
  drinks: "Refreshing beverages to complement your meal"
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "tacos":
      return <Utensils className="w-5 h-5" />;
    case "burritos":
      return <Sandwich className="w-5 h-5" />;
    case "tortas":
      return <Sandwich className="w-5 h-5" />;
    case "semitas":
      return <Sandwich className="w-5 h-5" />;
    case "drinks":
      return <Coffee className="w-5 h-5" />;
    default:
      return <Utensils className="w-5 h-5" />;
  }
};

export default function MenuSection({ menuItems, onItemSelect, cart }: MenuSectionProps) {
  const [currentItemIndexes, setCurrentItemIndexes] = useState<Record<string, number>>({});

  const handlePrevItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: prev[category] === 0 || prev[category] === undefined
        ? filteredItems.length - 1
        : (prev[category] || 0) - 1
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
                    {/* Mobile Layout (xs screens - 475px and below) - Image on top */}
                    <CardContent className="p-0 block relative xs:hidden">
                      <Badge variant="secondary" className="absolute top-2 right-2 mexican-red text-white text-sm px-3 py-1 z-10">
                        ${parseFloat(currentItem.price).toFixed(2)}
                      </Badge>
                      
                      {/* Image at top */}
                      <div className="relative">
                        <AspectRatio ratio={16/9} className="relative">
                          <img 
                            src={currentItem.image || "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                            alt={currentItem.name}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        </AspectRatio>
                      </div>

                      {/* Content below */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h4 className="font-bold text-lg dark-gray mb-1">
                            {currentItem.name}
                          </h4>
                          <div className="text-sm text-gray-600 mb-2">{currentItem.translation}</div>
                        </div>

                        <div className="text-sm text-gray-500 mb-4">
                          {currentItem.description}
                        </div>

                        <Button 
                          size="lg"
                          className="bg-mexican-red hover:bg-red-600 text-white px-6 w-full"
                        >
                          Customize & Add
                        </Button>
                      </div>
                    </CardContent>

                    {/* Desktop Layout (larger than xs - 476px+) - Image on side */}
                    <CardContent className="p-0 flex relative hidden xs:flex">
                      <Badge variant="secondary" className="absolute top-2 right-2 mexican-red text-white text-sm px-3 py-1 z-10">
                        ${parseFloat(currentItem.price).toFixed(2)}
                      </Badge>
                      
                      <div className="flex-1 p-6 pr-4 flex flex-col">
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

                        <Button 
                          size="lg"
                          className="bg-mexican-red hover:bg-red-600 text-white px-6 mt-auto"
                        >
                          Customize & Add
                        </Button>
                      </div>

                      <div className="w-1/2 relative">
                        <AspectRatio ratio={1} className="relative">
                          <img 
                            src={currentItem.image || "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                            alt={currentItem.name}
                            className="w-full h-full object-cover rounded-r-lg"
                          />
                        </AspectRatio>
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