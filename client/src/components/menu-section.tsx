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

export default function MenuSection({ menuItems, onItemSelect, cart }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("tacos");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  // Reset item index when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentItemIndex(0);
  };

  const handlePrevItem = () => {
    setCurrentItemIndex((prev) => 
      prev === 0 ? filteredItems.length - 1 : prev - 1
    );
  };

  const handleNextItem = () => {
    setCurrentItemIndex((prev) => 
      prev === filteredItems.length - 1 ? 0 : prev + 1
    );
  };

  const currentItem = filteredItems[currentItemIndex];

  return (
    <section id="menu-section" className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 dark-gray">
          Our Menu / Nuestro Menú
        </h3>

        {/* Category Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-8 space-x-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              className={`px-6 py-3 rounded-full whitespace-nowrap font-medium ${
                selectedCategory === category 
                  ? "bg-mexican-red hover:bg-red-600 text-white" 
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {categoryIcons[category]}
              <span className="ml-2">{categoryLabels[category] || category}</span>
            </Button>
          ))}
        </div>

        {/* Single Item Carousel */}
        {currentItem ? (
          <div className="max-w-2xl mx-auto">
            {/* Category Title */}
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
              {categoryLabels[selectedCategory] || selectedCategory}
            </h2>
            
            <div className="relative mx-1">
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onItemSelect(currentItem)}
              >
                <CardContent className="p-6 flex relative">
                  <Badge variant="secondary" className="absolute top-2 right-2 mexican-red text-white text-sm px-3 py-1 z-10">
                    ${parseFloat(currentItem.price).toFixed(2)}
                  </Badge>
                  
                  <div className="flex-1 pr-4">
                    <div className="mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg dark-gray mb-1">
                          {currentItem.name}
                        </h4>
                        <div className="text-sm text-gray-600 mb-2">{currentItem.translation}</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-4">
                      {currentItem.description}
                    </div>

                    <Button 
                      size="lg"
                      className="bg-mexican-red hover:bg-red-600 text-white px-6"
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
                      handlePrevItem();
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
                      handleNextItem();
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
                      onClick={() => setCurrentItemIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}