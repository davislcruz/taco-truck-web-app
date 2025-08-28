import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItem, Category } from "@shared/schema";
import { CartItem } from "@/pages/home-page";
import { Utensils, Coffee, Sandwich, ChevronLeft, ChevronRight, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const categoryIcons: Record<string, () => React.ReactNode> = {
  tacos: () => <Utensils className="h-6 w-6" />,
  burritos: () => <Utensils className="h-6 w-6" />,
  tortas: () => <Sandwich className="h-6 w-6" />,
  semitas: () => <Sandwich className="h-6 w-6" />,
  drinks: () => <Coffee className="h-6 w-6" />,
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

interface MenuSectionProps {
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  cart: CartItem[];
}

interface CategoryCarouselProps {
  category: string;
  filteredItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
}


function CategoryCarousel({ category, filteredItems, onItemSelect }: CategoryCarouselProps) {
  // Embla Carousel setup with responsive breakpoints
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 992px)': { slidesToScroll: 2 },
      '(min-width: 1460px)': { slidesToScroll: 3 }
    }
  }, [WheelGesturesPlugin()]);
  
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Navigation callbacks
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // Update button states and selected index
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Dot navigation
  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  // Setup event listeners
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Calculate responsive cards per view for dot pagination
  const [cardsPerView, setCardsPerView] = useState(1);
  
  useEffect(() => {
    const calculateCardsPerView = () => {
      const viewportWidth = window.innerWidth;
      if (viewportWidth < 992) {
        setCardsPerView(1); // mobile + small tablets
      } else if (viewportWidth >= 992 && viewportWidth < 1460) {
        setCardsPerView(2); // large tablets
      } else {
        setCardsPerView(3); // desktop
      }
    };

    calculateCardsPerView();
    window.addEventListener('resize', calculateCardsPerView);
    return () => window.removeEventListener('resize', calculateCardsPerView);
  }, []);

  // Calculate total pages for pagination dots
  const totalPages = Math.ceil(filteredItems.length / cardsPerView);
  const showNavigation = filteredItems.length > cardsPerView;
  const showPagination = totalPages > 1;

  // SVG icon as base64 for CSS fallback  
  const imagePlaceholderSvg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  `);

  // Function to render card content
  const renderCardContent = (item: MenuItem) => (
    <CardContent className="p-0 flex flex-col sm:flex-row relative">
      {/* Image section */}
      <div 
        className="w-full sm:w-2/5 sm:order-1 relative aspect-[3/2] sm:aspect-[4/3] rounded-t-lg sm:rounded-t-none sm:rounded-l-lg"
        style={{ 
          background: `url(${item.image || ''}), url("${imagePlaceholderSvg}"), #e5e7eb`,
          backgroundSize: 'cover, 48px 48px, auto',
          backgroundPosition: 'center, center, center',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat'
        }}
        aria-label={`Image of ${item.name} - ${item.description}`}
      >
      </div>

      {/* Content section */}
      <div className="flex-1 sm:order-2 p-4 sm:pl-6 flex flex-col relative">
        <div className="flex items-baseline gap-x-4 mb-2">
          <h4 className="card-title text-base-content">{item.name}</h4>
          <p className="text-xs text-base-content/70 italic ml-auto">{item.translation}</p>
        </div>

        <p className="text-base-content/85 mb-4 grow">{item.description}</p>
      </div>
    </CardContent>
  );

  return (
    <div className="w-full mx-auto">
      {/* Category Header */}
      <div className="text-center mb-4">
        <h3 className="text-base-content font-bold text-lg md:text-xl">{categoryLabels[category] || category}</h3>
      </div>

      {/* Category Tagline */}
      {categoryTaglines[category] && (
        <div className="text-center my-3 mx-auto text-xs sm:text-sm text-base-content/80">
          {categoryTaglines[category].includes('/') ? (
            <p>
              <em>{categoryTaglines[category].split(' / ')[0]}</em> / <span className="whitespace-nowrap font-semibold">{categoryTaglines[category].split(' / ')[1]}</span>
            </p>
          ) : (
            <p><em>{categoryTaglines[category]}</em></p>
          )}
        </div>
      )}

      {/* Embla Carousel */}
      <div className="relative mx-auto px-4" style={{ maxWidth: '1420px' }}>
        {/* Arrow Buttons Container - Positioned within safe boundaries */}
        <div className="relative">
          {/* Clean chevron navigation icons */}
          {showNavigation && (
            <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between z-10">
              {/* Left Arrow - Only show when can scroll previous */}
              {!prevBtnDisabled && (
                <ChevronLeft
                  className="h-10 w-10 text-primary/80 hover:text-primary cursor-pointer drop-shadow-md hover:scale-110 transition-all duration-200"
                  onClick={scrollPrev}
                />
              )}
              
              {/* Spacer div when left arrow is hidden */}
              {prevBtnDisabled && <div></div>}
              
              {/* Right Arrow - Only show when can scroll next */}
              {!nextBtnDisabled && (
                <ChevronRight
                  className="h-10 w-10 text-primary/80 hover:text-primary cursor-pointer drop-shadow-md hover:scale-110 transition-all duration-200"
                  onClick={scrollNext}
                />
              )}
            </div>
          )}

          {/* Carousel Content with safe padding for arrows */}
          <div className="px-16 mx-auto" style={{ maxWidth: '1356px' }}>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {filteredItems.map((item, idx) => (
                  <div
                    key={item.name + idx}
                    className="flex-[0_0_280px] sm:flex-[0_0_452px] relative"
                    style={{ paddingTop: '28px' }}
                  >
                    {/* Price Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 30
                      }}
                    >
                      <Badge variant="accent" className="text-accent-content text-sm px-3 py-1 shadow pointer-events-none">
                        ${parseFloat(item.price).toFixed(2)}
                      </Badge>
                    </div>
                    
                    {/* Menu Item Card */}
                    <Card 
                      className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow h-auto sm:h-48 flex flex-col cursor-pointer"
                      onClick={() => onItemSelect(item)}
                    >
                      {renderCardContent(item)}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      {showPagination && (
        <div className="flex items-center justify-center mt-4 mb-2">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedIndex 
                    ? 'bg-primary' 
                    : 'bg-base-content/30 hover:bg-base-content/50'
                }`}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
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

  // Placeholder handler for creating a new category
  const handleCreateCategory = () => {
    // TODO: Replace with modal or actual logic
    alert('Create Menu Category clicked!');
  };

  // Get categories in the proper order from the API, but only include those that have menu items
  const menuItemCategories = new Set(menuItems.map(item => item.category));
  const categories = categoriesData
    .filter(category => menuItemCategories.has(category.name))
    .sort((a, b) => a.order - b.order)
    .map(category => category.name);

  return (
    <section id="menu-section" className="py-8 lg:py-8 mt-16">
      <div className="container mx-auto px-4">
        
        {/* All Category Carousels */}
        <div className="space-y-8 pb-32">
          {categories.map((category) => {
            const filteredItems = menuItems.filter(item => item.category === category);
            if (filteredItems.length === 0) return null;

            return (
              <CategoryCarousel
                key={category}
                category={category}
                filteredItems={filteredItems}
                onItemSelect={onItemSelect}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}