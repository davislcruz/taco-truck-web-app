import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/use-branding";
import { useDaisyUITheme } from "@/hooks/use-daisyui-theme";
import { apiRequest } from "@/lib/queryClient";
import { 
  Type, 
  Check,
  Paintbrush,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// DaisyUI themes with descriptions
export const DAISYUI_THEMES = [
  { id: 'light', name: 'Light', description: 'Clean and bright default theme' },
  { id: 'dark', name: 'Dark', description: 'Professional dark theme' },
  { id: 'cupcake', name: 'Cupcake', description: 'Sweet pastel colors' },
  { id: 'bumblebee', name: 'Bumblebee', description: 'Bright yellow and black' },
  { id: 'emerald', name: 'Emerald', description: 'Fresh green palette' },
  { id: 'corporate', name: 'Corporate', description: 'Professional business theme' },
  { id: 'synthwave', name: 'Synthwave', description: 'Neon 80s vibes' },
  { id: 'retro', name: 'Retro', description: 'Vintage warm tones' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Futuristic neon theme' },
  { id: 'valentine', name: 'Valentine', description: 'Romantic pink theme' },
  { id: 'halloween', name: 'Halloween', description: 'Spooky orange and purple' },
  { id: 'garden', name: 'Garden', description: 'Natural green theme' },
  { id: 'forest', name: 'Forest', description: 'Deep forest greens' },
  { id: 'aqua', name: 'Aqua', description: 'Cool aquatic blues' },
  { id: 'lofi', name: 'Lo-Fi', description: 'Muted aesthetic tones' },
  { id: 'pastel', name: 'Pastel', description: 'Soft pastel palette' },
  { id: 'fantasy', name: 'Fantasy', description: 'Magical purple theme' },
  { id: 'wireframe', name: 'Wireframe', description: 'Minimal black and white' },
  { id: 'black', name: 'Black', description: 'Pure black theme' },
  { id: 'luxury', name: 'Luxury', description: 'Premium gold and black' },
  { id: 'dracula', name: 'Dracula', description: 'Dark vampire theme' },
  { id: 'cmyk', name: 'CMYK', description: 'Cyan, magenta, yellow theme' },
  { id: 'autumn', name: 'Autumn', description: 'Warm autumn colors' },
  { id: 'business', name: 'Business', description: 'Professional business theme' },
  { id: 'acid', name: 'Acid', description: 'Bright acid colors' },
  { id: 'lemonade', name: 'Lemonade', description: 'Fresh lemonade colors' },
  { id: 'night', name: 'Night', description: 'Dark night theme' },
  { id: 'coffee', name: 'Coffee', description: 'Warm coffee brown theme' },
  { id: 'winter', name: 'Winter', description: 'Cool winter blues' },
  { id: 'dim', name: 'Dim', description: 'Dimmed dark theme' },
  { id: 'nord', name: 'Nord', description: 'Nordic inspired theme' },
  { id: 'sunset', name: 'Sunset', description: 'Beautiful sunset colors' },
  { id: 'caramellatte', name: 'Caramel Latte', description: 'Warm caramel latte theme' },
  { id: 'abyss', name: 'Abyss', description: 'Deep ocean abyss theme' },
  { id: 'silk', name: 'Silk', description: 'Smooth silk textures' }
];

export default function DaisyUIThemeSelector() {
  const { toast } = useToast();
  const { restaurantName } = useBranding();
  const { currentTheme, setTheme, isLoading: themeLoading } = useDaisyUITheme();
  
  // Form states
  const [brandingName, setBrandingName] = useState(restaurantName);
  const [isSaving, setIsSaving] = useState(false);
  
  // Carousel states
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
      '(min-width: 1280px)': { slidesToScroll: 4 }
    }
  });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const handleUpdateBranding = async () => {
    if (!brandingName.trim()) return;
    
    try {
      const response = await apiRequest("PUT", "/api/settings/restaurant_name", {
        value: brandingName.trim()
      });
      if (response.ok) {
        toast({
          title: "Restaurant Name Updated",
          description: "Your restaurant name has been updated successfully.",
        });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Failed to update branding:", error);
      toast({
        title: "Error",
        description: "Failed to update restaurant name.",
        variant: "destructive",
      });
    }
  };

  const handleThemeSelect = async (themeId: string) => {
    setIsSaving(true);
    
    try {
      await setTheme(themeId);
      
      const themeName = DAISYUI_THEMES.find(t => t.id === themeId)?.name || themeId;
      toast({
        title: "Theme Applied",
        description: `${themeName} theme has been applied successfully.`,
      });
    } catch (error) {
      console.error("Failed to apply theme:", error);
      toast({
        title: "Error", 
        description: "Failed to apply theme.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (themeLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-base-200 shadow-xl">
          <CardContent className="p-6">
            <div className="text-center py-8 text-base-content">
              Loading themes...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consolidated Settings Section */}
      <Card className="bg-base-200 shadow-xl">
        <CardHeader className="bg-primary text-primary-content rounded-t-lg">
          <CardTitle className="flex items-center text-primary-content">
            <Type className="h-5 w-5 mr-2" />
            Restaurant Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Restaurant Branding */}
          <div>
            <Label htmlFor="restaurant-name" className="text-base-content font-medium">Restaurant Name</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="restaurant-name"
                placeholder="Enter restaurant name"
                value={brandingName}
                onChange={(e) => setBrandingName(e.target.value)}
                className="flex-1 bg-base-100 border-base-200 text-base-content"
              />
              <Button 
                onClick={handleUpdateBranding}
                disabled={!brandingName.trim() || brandingName === restaurantName}
                className="btn btn-primary"
              >
                Update Name
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection Section */}
      <Card className="bg-base-200 shadow-xl">
        <CardHeader className="bg-secondary text-secondary-content rounded-t-lg">
          <CardTitle className="flex items-center text-secondary-content">
            <Paintbrush className="h-5 w-5 mr-2" />
            DaisyUI Themes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium text-base-content">Choose Your Theme</Label>
              <span className="text-sm text-base-content/70">Current Theme: {DAISYUI_THEMES.find(t => t.id === currentTheme)?.name || currentTheme}</span>
            </div>
            <p className="text-sm text-base-content/70 mt-1">
              Select from {DAISYUI_THEMES.length} professionally designed themes. Changes apply instantly across your entire app.
            </p>
          </div>

          <div className="relative">
            {/* Carousel Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollPrev}
                disabled={prevBtnDisabled}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-base-content/60">
                {DAISYUI_THEMES.length} themes available
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollNext}
                disabled={nextBtnDisabled}
                className="btn btn-outline btn-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Embla Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {DAISYUI_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className="flex-[0_0_280px] sm:flex-[0_0_240px]"
                  >
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-lg h-full ${
                        currentTheme === theme.id 
                          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                          : 'border-base-100 hover:border-base-content/20'
                      }`}
                      onClick={() => handleThemeSelect(theme.id)}
                    >
                      {/* Standard DaisyUI Theme Preview Card */}
                      <div data-theme={theme.id} className="p-4 rounded-lg bg-base-300">
                        <div className="space-y-3">
                          {/* Theme Name and Check */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-base-content">{theme.name}</h3>
                            {currentTheme === theme.id && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-content" />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-base-content/70">{theme.description}</p>
                          
                          {/* Color Preview Using DaisyUI Semantic Classes */}
                          <div className="space-y-2">
                            {/* Header Preview */}
                            <div className="h-6 rounded-md flex items-center px-3 text-xs font-medium bg-primary text-primary-content">
                              Header
                            </div>
                            
                            {/* Content Area */}
                            <div className="h-20 p-2 rounded-md bg-base-200">
                              <div className="h-full rounded border border-base-100 p-2 flex flex-col justify-between">
                                <span className="text-xs text-base-content">
                                  Card Content
                                </span>
                                {/* Three Button Previews Using DaisyUI Classes */}
                                <div className="flex gap-1">
                                  <div className="btn btn-primary btn-xs" title="Primary">P</div>
                                  <div className="btn btn-secondary btn-xs" title="Secondary">S</div>
                                  <div className="btn btn-accent btn-xs" title="Accent">A</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Color Palette Using DaisyUI Color Classes */}
                          <div className="flex space-x-1">
                            <div className="w-4 h-4 rounded-full border bg-primary" title="Primary" />
                            <div className="w-4 h-4 rounded-full border bg-secondary" title="Secondary" />
                            <div className="w-4 h-4 rounded-full border bg-accent" title="Accent" />
                            <div className="w-4 h-4 rounded-full border bg-base-100" title="Base" />
                          </div>
                        </div>
                      </div>

                      {/* Loading Overlay */}
                      {isSaving && currentTheme === theme.id && (
                        <div className="absolute inset-0 bg-base-100/80 rounded-lg flex items-center justify-center">
                          <div className="text-sm text-base-content flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Applying...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}