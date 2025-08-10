import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface BrandingContextType {
  restaurantName: string;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  restaurantName: "La Charreada",
  isLoading: true,
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurantName, setRestaurantName] = useState("La Charreada");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        console.log("Fetching branding from /api/settings/restaurant_name");
        const response = await apiRequest("GET", "/api/settings/restaurant_name");
        console.log("Branding response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Branding data received:", data);
          setRestaurantName(data.value || "La Charreada");
        }
      } catch (error) {
        console.error("Failed to fetch branding:", error);
        // Keep default "La Charreada" on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ restaurantName, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  return useContext(BrandingContext);
};