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
  const [bodyWidth, setBodyWidth] = useState<number>(0);
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

  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  


  // Calculate body/html width on mount and resize
  React.useEffect(() => {
    const calculateDimensions = () => {
      const bodyWidth = document.body.offsetWidth;
      const htmlWidth = document.documentElement.offsetWidth;
      const viewportWidth = window.innerWidth;
      const documentWidth = document.documentElement.scrollWidth;
      
      setBodyWidth(bodyWidth);
      

    };

    calculateDimensions();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateDimensions);
    
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  // Button navigation functions - separate from drag
  const handleButtonPrevItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1) return;
    
    // Update the index first
    setCurrentItemIndexes(prev => {
      const currentIndex = prev[category] ?? 0; // Use nullish coalescing for proper initialization
      return {
        ...prev,
        [category]: currentIndex === 0 ? filteredItems.length - 1 : currentIndex - 1
      };
    });
    
    // Trigger continuous sliding animation from right
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX: 0,
      currentX: 452, // Slide from right to left
      category,
      isTransitioning: true
    }));
    
    // Animate to final position with continuous effect
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        currentX: 0,
        isTransitioning: true
      }));
    }, 50);
    
    // Reset state after continuous animation
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        startX: 0,
        currentX: 0,
        category: null,
        isTransitioning: false
      }));
    }, 550);
  };

  const handleButtonNextItem = (category: string) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    if (filteredItems.length <= 1) return;
    
    // Update the index first
    setCurrentItemIndexes(prev => {
      const currentIndex = prev[category] ?? 0; // Use nullish coalescing for proper initialization
      return {
        ...prev,
        [category]: currentIndex === filteredItems.length - 1 ? 0 : currentIndex + 1
      };
    });
    
    // Trigger continuous sliding animation from left
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX: 0,
      currentX: -452, // Slide from left to right
      category,
      isTransitioning: true
    }));
    
    // Animate to final position with continuous effect
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        currentX: 0,
        isTransitioning: true
      }));
    }, 50);
    
    // Reset state after continuous animation
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        startX: 0,
        currentX: 0,
        category: null,
        isTransitioning: false
      }));
    }, 550);
  };

  const handleDotNavigation = (category: string, index: number) => {
    const filteredItems = menuItems.filter(item => item.category === category);
    const currentIndex = currentItemIndexes[category] ?? 0; // Use nullish coalescing for proper initialization
    
    if (index === currentIndex || filteredItems.length <= 1) return;
    
    // Update the index first
    setCurrentItemIndexes(prev => ({
      ...prev,
      [category]: index
    }));
    
    // Determine slide direction for continuous effect
    const slideDirection = index > currentIndex ? -452 : 452;
    
    // Trigger continuous sliding animation
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX: 0,
      currentX: slideDirection,
      category,
      isTransitioning: true
    }));
    
    // Animate to final position with continuous effect
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        currentX: 0,
        isTransitioning: true
      }));
    }, 50);
    
    // Reset state after continuous animation
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        startX: 0,
        currentX: 0,
        category: null,
        isTransitioning: false
      }));
    }, 550);
  };

  // Manual drag functions - completely separate from button navigation
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

    // Calculate drag distance correctly
    const dragDistance = dragState.currentX; // This is already the delta from handleManualDragMove
    const threshold = 50;
    
    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0) {
        // Dragged right - go to previous item
        setCurrentItemIndexes(prev => {
          const currentIndex = prev[category] ?? 0;
          return {
            ...prev,
            [category]: currentIndex === 0 ? filteredItems.length - 1 : currentIndex - 1
          };
        });
      } else {
        // Dragged left - go to next item
        setCurrentItemIndexes(prev => {
          const currentIndex = prev[category] ?? 0;
          return {
            ...prev,
            [category]: currentIndex === filteredItems.length - 1 ? 0 : currentIndex + 1
          };
        });
      }
    }
    
    // Simple reset for manual drag - no fancy animation
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
  );

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

            if (!currentItem) return null;

            // Calculate which items to show for sliding animation
            const getDragInfo = () => {
              const prevIndex = currentItemIndex === 0 ? filteredItems.length - 1 : currentItemIndex - 1;
              const nextIndex = currentItemIndex === filteredItems.length - 1 ? 0 : currentItemIndex + 1;
              
              if (dragState.isDragging && dragState.category === category) {
                // Use the stored deltaX directly from manual drag functions
                const deltaX = dragState.currentX;
                
                return {
                  deltaX,
                  prevItem: filteredItems.length > 1 ? filteredItems[prevIndex] : null,
                  nextItem: filteredItems.length > 1 ? filteredItems[nextIndex] : null,
                  isDragging: true
                };
              }
              
              // Always show prev/next items for smooth transitions
              return { 
                deltaX: 0, 
                prevItem: filteredItems.length > 1 ? filteredItems[prevIndex] : null,
                nextItem: filteredItems.length > 1 ? filteredItems[nextIndex] : null,
                isDragging: false 
              };
            };

            const dragInfo = getDragInfo();
            
            const getTransitionClass = () => {
              if (dragInfo.isDragging && !dragState.isTransitioning) return '';
              return dragState.isTransitioning ? 'transition-transform duration-500 ease-in-out' : '';
            };

            return (
              <div key={category} className="max-w-2xl mx-auto">
                {/* Category Title with Navigation */}
                <div className="relative">
                  <h2 className="text-2xl font-bold text-center my-0 text-red-600">
                    {categoryLabels[category] || category}
                  </h2>
                  {categoryTaglines[category] && (
                    <div className="text-xs text-green-600 text-center my-0 mb-0">
                      {categoryTaglines[category].includes('/') ? (
                        <>
                          {categoryTaglines[category].split(' / ')[0]} / <span className="whitespace-nowrap">{categoryTaglines[category].split(' / ')[1]}</span>
                        </>
                      ) : (
                        categoryTaglines[category]
                      )}
                    </div>
                  )}

                  {/* Navigation Arrows at Title Level */}
                  {filteredItems.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-0 top-1/2 -translate-y-1/2 -mt-[20px] xxs:-mt-[18px] mb-[-16px] bg-white/70 hover:bg-white/90 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleButtonPrevItem(category);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mt-[20px] xxs:-mt-[18px] mb-[-16px] bg-white/70 hover:bg-white/90 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleButtonNextItem(category);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div className="relative mx-1 max-w-[452px] overflow-hidden">
                  <div 
                    className={`flex ${getTransitionClass()}`}
                    style={{
                      transform: `translateX(${filteredItems.length === 1 ? '0px' : -452 + (dragInfo.isDragging ? dragInfo.deltaX : 0)}px)`,
                      width: filteredItems.length === 1 ? '452px' : '1356px' // Single item vs three cards
                    }}
                    onMouseDown={(e) => handleDragStart(e, category)}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => handleDragStart(e, category)}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                  >
                    {/* Previous Item */}
                    {dragInfo.prevItem && (
                      <div className="w-[452px] flex-shrink-0 relative p-3">
                        <Badge variant="secondary" className="absolute -top-1 -right-1 mexican-red text-white text-sm px-3 py-1 z-20 border border-gray-300 shadow-lg">
                          ${parseFloat(dragInfo.prevItem.price).toFixed(2)}
                        </Badge>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow select-none cursor-grab active:cursor-grabbing">
                          {renderCardContent(dragInfo.prevItem, category)}
                        </Card>
                      </div>
                    )}
                    
                    {/* Current Item */}
                    <div className="w-[452px] flex-shrink-0 relative p-3">
                      <Badge variant="secondary" className="absolute -top-1 -right-1 mexican-red text-white text-sm px-3 py-1 z-20 border border-gray-300 shadow-lg">
                        ${parseFloat(currentItem.price).toFixed(2)}
                      </Badge>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow select-none cursor-grab active:cursor-grabbing min-h-[200px]">
                        {renderCardContent(currentItem, category)}
                      </Card>
                    </div>
                    
                    {/* Next Item */}
                    {dragInfo.nextItem && (
                      <div className="w-[452px] flex-shrink-0 relative p-3">
                        <Badge variant="secondary" className="absolute -top-1 -right-1 mexican-red text-white text-sm px-3 py-1 z-20 border border-gray-300 shadow-lg">
                          ${parseFloat(dragInfo.nextItem.price).toFixed(2)}
                        </Badge>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow select-none cursor-grab active:cursor-grabbing">
                          {renderCardContent(dragInfo.nextItem, category)}
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
                {/* Navigation Dots */}
                {filteredItems.length > 1 && (
                  <div className="flex items-center justify-center mt-6">
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