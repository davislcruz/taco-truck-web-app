import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function SimpleRouter({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.hash.slice(1) || '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useSimpleRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useSimpleRouter must be used within SimpleRouter');
  }
  return context;
}

export function useSimpleLocation(): [string, (path: string) => void] {
  const { currentPath, navigate } = useSimpleRouter();
  return [currentPath, navigate];
}