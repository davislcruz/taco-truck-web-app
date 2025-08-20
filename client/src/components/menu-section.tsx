import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItem, Category } from "@shared/schema";
import { CartItem } from "@/pages/home-page";
import { Utensils, Coffee, Sandwich, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const categoryIcons: Record<string, () => React.ReactNode> = {
  tacos: () => <Utensils className="h-4 w-4" />,
  burritos: () => <Utensils className="h-4 w-4" />,
  tortas: () => <Sandwich className="h-4 w-4" />,
  semitas: () => <Sandwich className="h-4 w-4" />,
  drinks: () => <Coffee className="h-4 w-4" />,
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

  // Function to render card content
  const renderCardContent = (item: MenuItem) => (
    <CardContent className="p-0 flex flex-col sm:flex-row relative">
      {/* Image section */}
      <div className="w-full sm:w-2/5 sm:order-1 relative">
        <img 
          src={item.image || "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
          alt={item.name}
          className="w-full h-full object-cover rounded-t-lg sm:rounded-t-none sm:rounded-l-lg"
        />
      </div>

      {/* Content section */}
      <div className="flex-1 sm:order-2 p-4 sm:pl-6 flex flex-col relative">
        <div className="flex items-baseline gap-x-4 mb-2">
          <h4 className="card-title text-base-content">{item.name}</h4>
          <p className="text-xs text-base-content/70 italic ml-auto">{item.translation}</p>
        </div>

        <p className="line-clamp-2 text-base-content/85 mb-4 grow">{item.description}</p>

        <Button 
          size="default"
          className="btn btn-primary mt-auto font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onItemSelect(item);
          }}
        >
          Add
        </Button>
      </div>
    </CardContent>
  );

  return (
    <div className="w-full mx-auto">
      {/* Category Header with Navigation */}
      <div className="flex items-center justify-center mx-auto mb-4" style={{ maxWidth: '1356px' }}>
        {showNavigation ? (
          <Button
            variant="outline"
            size="icon"
            className="btn btn-outline btn-sm shadow"
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-10 h-10" />
        )}
        
        <div className="flex-1 flex justify-center items-center mx-4">
          <h3 className="text-base-content font-bold text-lg md:text-xl text-center my-0">{categoryLabels[category] || category}</h3>
        </div>
        
        {showNavigation ? (
          <Button
            variant="outline"
            size="icon"
            className="btn btn-outline btn-sm shadow"
            onClick={scrollNext}
            disabled={nextBtnDisabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-10 h-10" />
        )}
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
      <div className="relative mx-auto" style={{ maxWidth: '1356px' }}>
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
                <Card className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow h-auto sm:h-48 flex flex-col">
                  {renderCardContent(item)}
                </Card>
              </div>
            ))}
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
        <h2 className="text-base-content font-bold text-2xl md:text-3xl lg:text-4xl text-center mb-8">Our Menu <span className="text-base-content/70">/</span> Nuestro Menú</h2>
        
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