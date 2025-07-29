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
import { useState, useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MenuItem, Category } from "@shared/schema";
import { CartItem } from "@/pages/home-page";
import { Utensils, Coffee, Sandwich, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MenuSectionProps {
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  cart: CartItem[];
}

export default function MenuSection({ menuItems, onItemSelect, cart }: MenuSectionProps) {
  // Fetch categories from API to get proper ordering
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return res.json() as Promise<Category[]>;
    },
  });

  // State hooks and derived values
  // Placeholder handler for creating a new category
  const handleCreateCategory = () => {
    // TODO: Replace with modal or actual logic
    alert('Create Menu Category clicked!');
  };
  const [currentItemIndexes, setCurrentItemIndexes] = useState<Record<string, number>>({});
  const [bodyWidth, setBodyWidth] = useState<number>(0);
  const [cardWidth, setCardWidth] = useState<number>(452);
  const [cardsPerView, setCardsPerView] = useState<number>(1);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    currentX: number;
    category: string | null;
    isTransitioning: boolean;
  }>({
    isDragging: false,
    startX: 0,
    currentX: 0,
    category: null,
    isTransitioning: false
  });

  // Get categories in the proper order from the API, but only include those that have menu items
  const menuItemCategories = new Set(menuItems.map(item => item.category));
  const categories = categoriesData
    .filter(category => menuItemCategories.has(category.name))
    .sort((a, b) => a.order - b.order)
    .map(category => category.name);

  useEffect(() => {
    const calculateDimensions = () => {
      const bodyWidth = document.body.offsetWidth;
      const viewportWidth = window.innerWidth;
      setBodyWidth(bodyWidth);
      // Card width stays fixed for now
      const newCardWidth = viewportWidth < 491 ? 280 : 452;
      setCardWidth(newCardWidth);

      // Responsive cards per view
      if (viewportWidth < 992) {
        setCardsPerView(1); // mobile + small tablets
      } else if (viewportWidth >= 992 && viewportWidth < 1460) {
        setCardsPerView(2); // large tablets
      } else {
        setCardsPerView(3); // desktop
      }
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  // Button navigation functions - instant change without animation
  const handleButtonPrevItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1) return;
    setCurrentItemIndexes(prev => {
      const currentIndex = prev[category] ?? 0;
      return {
        ...prev,
        [category]: currentIndex === 0 ? filteredItems.length - 1 : currentIndex - 1
      };
    });
  };

  const handleButtonNextItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1) return;
    setCurrentItemIndexes(prev => {
      const currentIndex = prev[category] ?? 0;
      return {
        ...prev,
        [category]: currentIndex === filteredItems.length - 1 ? 0 : currentIndex + 1
      };
    });
  };

  const handleDotNavigation = (category: string, index: number) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    const currentIndex = currentItemIndexes[category] ?? 0;
    if (index === currentIndex || filteredItems.length <= 1) return;
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: index
    }));
  };

  // Manual drag functions
  const handleManualDragStart = (category: string, startX: number) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX,
      currentX: 0,
      category,
      isTransitioning: false
    }));
  };

  const handleManualDragMove = (currentX: number) => {
    setDragState(prev => ({
      ...prev,
      currentX: currentX - prev.startX
    }));
  };

  const handleManualDragEnd = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1) {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        startX: 0,
        currentX: 0,
        category: null,
        isTransitioning: false
      }));
      return;
    }
    const dragDistance = dragState.currentX;
    const threshold = Math.max(cardWidth * 0.15, 50);
    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0) {
        setCurrentItemIndexes(prev => {
          const currentIndex = prev[category] ?? 0;
          return {
            ...prev,
            [category]: currentIndex === 0 ? filteredItems.length - 1 : currentIndex - 1
          };
        });
      } else {
        setCurrentItemIndexes(prev => {
          const currentIndex = prev[category] ?? 0;
          return {
            ...prev,
            [category]: currentIndex === filteredItems.length - 1 ? 0 : currentIndex + 1
          };
        });
      }
    }
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      startX: 0,
      currentX: 0,
      category: null,
      isTransitioning: false
    }));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, category: string) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    handleManualDragStart(category, clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.category) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    handleManualDragMove(clientX);
  };

  const handleDragEnd = () => {
    if (!dragState.isDragging || !dragState.category) return;
    handleManualDragEnd(dragState.category);
  };

  // Function to render card content to avoid repetition
  const renderCardContent = (item: MenuItem, category: string) => (
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
  ); // End of renderCardContent

  return (
    <section id="menu-section" className="py-4 lg:py-4 mt-16">
      <div className="max-w-[1800px] mx-auto px-1 sm:px-1.5 lg:px-2">
        <h3 className="text-2xl md:text-3xl font-bold text-center dark-gray">
          Our Menu / Nuestro Menú
        </h3>
        {/* Removed owner-only button from customer view */}
        {/* All Category Carousels */}
        <div className="space-y-6 mb-28">
          {categories.map((category) => {
            const filteredItems = menuItems.filter(item => item.category === category);
            const currentItemIndex = currentItemIndexes[category] || 0;
            const currentItem = filteredItems[currentItemIndex];
            if (!currentItem) return null;
            const getTransitionClass = () => {
              if (dragState.isDragging && !dragState.isTransitioning) return '';
              return dragState.isTransitioning ? 'transition-transform duration-500 ease-in-out' : '';
            };
            let firstVisibleIndex = currentItemIndex;
            if (firstVisibleIndex > filteredItems.length - cardsPerView) {
              firstVisibleIndex = Math.max(filteredItems.length - cardsPerView, 0);
            }
            return (
              <div key={category} className="w-full mx-auto">
                <div className="flex items-center justify-center mx-auto" style={{ width: `${cardWidth * cardsPerView}px` }}>
                  {filteredItems.length > cardsPerView ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/70 hover:bg-white/90 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleButtonPrevItem(category);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="w-10 h-10" />
                  )}
                  <div className="flex-1 flex justify-center items-center mx-4">
                    <h2 className="text-2xl font-bold my-0 text-red-600 text-center w-full">
                      {categoryLabels[category] || category}
                    </h2>
                  </div>
                  {filteredItems.length > cardsPerView ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/70 hover:bg-white/90 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleButtonNextItem(category);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="w-10 h-10" />
                  )}
                </div>
                {categoryTaglines[category] && (
                  <div className="text-xs text-green-600 text-center my-0 mt-[11px] mb-[11px]">
                    {categoryTaglines[category].includes('/') ? (
                      <>
                        {categoryTaglines[category].split(' / ')[0]} / <span className="whitespace-nowrap">{categoryTaglines[category].split(' / ')[1]}</span>
                      </>
                    ) : (
                      categoryTaglines[category]
                    )}
                  </div>
                )}
                <div className="relative mx-auto" style={{ width: `${cardWidth * cardsPerView}px` }}>
                  <div
                    className="overflow-hidden"
                    style={{
                      width:
                        cardsPerView === 1
                          ? cardWidth * cardsPerView + 68 - 45
                          : cardsPerView === 2
                            ? cardWidth * cardsPerView + 68 - 20
                            : cardWidth * cardsPerView + 68,
                      marginLeft:
                        cardsPerView === 1
                          ? -(68 / 2) + 34
                          : cardsPerView === 2
                            ? -(68 / 2) + 22
                            : -(68 / 2) + 10
                    }}
                  >
                    <div
                      className={`flex ${getTransitionClass()}`}
                      style={{
                        transform: `translateX(-${firstVisibleIndex * (cardWidth + 24)}px)`,
                        width: `${filteredItems.length * cardWidth + (filteredItems.length - 1) * 24 + 20}px`, // add 24px margin per card except last, plus 20px for badge
                        minHeight: '100%',
                        alignItems: 'stretch'
                      }}
                      onMouseDown={(e) => handleDragStart(e, category)}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchStart={(e) => handleDragStart(e, category)}
                      onTouchMove={handleDragMove}
                      onTouchEnd={handleDragEnd}
                    >
                      {filteredItems.map((item, idx) => (
                        <div
                          key={item.name + idx}
                          className="flex-shrink-0"
                          style={{
                            width: `${cardWidth}px`,
                            position: 'relative',
                            paddingTop: '28px',
                            overflow: 'visible',
                            marginRight: idx !== filteredItems.length - 1 ? '24px' : '0' // 24px gap except last card
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
                            {(idx >= firstVisibleIndex && idx < firstVisibleIndex + cardsPerView) ? (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-18px',
                                  right: '-18px',
                                  zIndex: 30
                                }}
                              >
                                <Badge variant="secondary" className="mexican-red text-white text-sm px-3 py-1 border border-gray-300 shadow-lg pointer-events-none">
                                  ${parseFloat(item.price).toFixed(2)}
                                </Badge>
                              </div>
                            ) : null}
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow select-none cursor-grab active:cursor-grabbing h-full flex flex-col">
                              {renderCardContent(item, category)}
                            </Card>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {filteredItems.length > cardsPerView && (
                  <div className="flex items-center justify-center mt-[5px] mb-[5px]">
                    <div className="flex space-x-2">
                      {filteredItems.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentItemIndex 
                              ? 'bg-mexican-red' 
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          onClick={() => handleDotNavigation(category, index)}
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
