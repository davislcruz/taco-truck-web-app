import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItem } from "@shared/schema";
import { CartItem } from "@/pages/home-page";
import { Utensils, Coffee, Sandwich } from "lucide-react";

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
  
  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

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
              onClick={() => setSelectedCategory(category)}
            >
              {categoryIcons[category]}
              <span className="ml-2">{categoryLabels[category] || category}</span>
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onItemSelect(item)}
            >
              <div className="aspect-video w-full">
                <img 
                  src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg dark-gray mb-1">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{item.translation}</p>
                  </div>
                  <Badge variant="secondary" className="mexican-red text-white">
                    ${parseFloat(item.price).toFixed(2)}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {item.meats && item.meats.slice(0, 2).map((meat) => (
                      <Badge key={meat} variant="outline" className="text-xs">
                        {meat}
                      </Badge>
                    ))}
                    {item.sizes && item.sizes.slice(0, 2).map((size) => (
                      <Badge key={size} variant="outline" className="text-xs">
                        {size}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    size="sm"
                    className="bg-mexican-red hover:bg-red-600 text-white"
                  >
                    Add +
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
