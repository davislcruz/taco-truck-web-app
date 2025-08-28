import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { BrandingProvider } from "@/hooks/use-branding";
import { DaisyUIThemeProvider } from "@/hooks/use-daisyui-theme";
import { Router, Route, Switch } from "wouter";
import WelcomeHomePage from "@/pages/welcome-home-page";
import MenuPage from "@/pages/menu-page";
import AuthPage from "@/pages/auth-page";
import CheckoutPage from "@/pages/checkout-page";
import OwnerDashboardPage from "@/pages/owner-dashboard-page";
import ErrorBoundary from "@/components/error-boundary";

function AppRouter() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={WelcomeHomePage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/dashboard" component={OwnerDashboardPage} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DaisyUIThemeProvider>
          <AuthProvider>
            <BrandingProvider>
              <TooltipProvider>
                <Toaster />
                <AppRouter />
              </TooltipProvider>
            </BrandingProvider>
          </AuthProvider>
        </DaisyUIThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
