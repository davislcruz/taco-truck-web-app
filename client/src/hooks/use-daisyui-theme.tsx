import { createContext, useContext, useEffect, useState } from "react";
import type { FC, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface DaisyUIThemeContextType {
  currentTheme: string;
  setTheme: (themeId: string) => Promise<void>;
  isLoading: boolean;
}

const DaisyUIThemeContext = createContext<DaisyUIThemeContextType>({
  currentTheme: 'light',
  setTheme: async () => {},
  isLoading: false,
});

export function DaisyUIThemeProvider({ children }: { children: ReactNode }) {
  // Read theme from DOM immediately (already injected by server)
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
    return 'light';
  });
  const [isLoading, setIsLoading] = useState(false); // No loading needed since theme is pre-injected

  // Sync with server on mount to ensure consistency (but don't flash)
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const response = await apiRequest("GET", "/api/settings/app_theme");
        if (response.ok) {
          const data = await response.json();
          const serverTheme = data.value || 'light';
          const domTheme = document.documentElement.getAttribute('data-theme');
          
          // Only update if server theme differs from DOM theme
          if (serverTheme !== domTheme) {
            console.log(`🎨 Syncing theme from server: ${serverTheme}`);
            document.documentElement.setAttribute('data-theme', serverTheme);
            setCurrentTheme(serverTheme);
          }
        }
      } catch (error) {
        console.error("Failed to sync theme with server:", error);
      }
    };

    // No setTimeout delay - sync immediately
    syncWithServer();
  }, []);

  const setTheme = async (themeId: string) => {
    try {
      // Apply theme immediately for instant feedback
      console.log(`🎨 Switching to theme: ${themeId}`);
      document.documentElement.setAttribute('data-theme', themeId);
      setCurrentTheme(themeId);
      
      // Save to backend
      const response = await apiRequest("PUT", "/api/settings/app_theme", {
        value: themeId
      });
      console.log(`✅ Theme saved successfully: ${themeId}`, response.status);
    } catch (error) {
      console.error("❌ Failed to save theme:", error);
      throw error;
    }
  };

  return (
    <DaisyUIThemeContext.Provider value={{ 
      currentTheme, 
      setTheme, 
      isLoading 
    }}>
      {children}
    </DaisyUIThemeContext.Provider>
  );
}

export const useDaisyUITheme = () => {
  return useContext(DaisyUIThemeContext);
};