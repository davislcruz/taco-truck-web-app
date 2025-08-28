import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Star, Clock, MapPin, Phone, Menu, Home, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";

export default function WelcomeHomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { restaurantName } = useBranding();

  const handleOwnerAccess = () => {
    if (user) {
      setLocation('/dashboard');
    } else {
      setLocation('/auth');
    }
  };

  const scrollToMenu = () => {
    setLocation('/menu');
  };

  return (
    <>
      {/* Header */}
      <div className="bg-base-100 border-b-2 border-primary shadow-lg fixed top-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-accent-content" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content drop-shadow-sm">{restaurantName}</h1>
                <p className="text-sm text-base-content/90">Authentic Mexican Food Truck</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleOwnerAccess}
                className="bg-base-content/10 hover:bg-base-content/20 text-base-content border-base-content/30 hover:border-base-content/50 backdrop-blur"
              >
                <User className="h-4 w-4 mr-2" />
                Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mt-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-base-content mb-4">
              Welcome to {restaurantName}
            </h2>
            <p className="text-xl text-base-content/80 mb-8">
              Fresh, authentic Mexican flavors made with love and served with a smile
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-content"
                onClick={() => setLocation('/menu')}
              >
                Order Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => setLocation('/menu')}
              >
                View Menu
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Items Section */}
      <div className="container mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold text-center text-base-content mb-8">
          Customer Favorites
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="bg-base-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/menu')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-accent" />
              </div>
              <h4 className="text-xl font-semibold text-base-content mb-2">Tacos de Carnitas</h4>
              <p className="text-base-content/70 mb-4">Three soft corn tortillas with slow-cooked pulled pork</p>
              <div className="flex items-center justify-center text-warning">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-2 text-base-content/70">4.9</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-base-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/menu')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-accent" />
              </div>
              <h4 className="text-xl font-semibold text-base-content mb-2">Carne Asada Burrito</h4>
              <p className="text-base-content/70 mb-4">Large flour tortilla with marinated grilled beef</p>
              <div className="flex items-center justify-center text-warning">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-2 text-base-content/70">4.8</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-base-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/menu')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-accent" />
              </div>
              <h4 className="text-xl font-semibold text-base-content mb-2">Fresh Horchata</h4>
              <p className="text-base-content/70 mb-4">Creamy rice and cinnamon beverage, a Mexican favorite</p>
              <div className="flex items-center justify-center text-warning">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-2 text-base-content/70">4.9</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="bg-base-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-lg font-semibold text-base-content mb-2">Quick Service</h4>
              <p className="text-base-content/70">Fresh food prepared fast, usually ready in 10-15 minutes</p>
            </div>
            <div className="flex flex-col items-center">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-lg font-semibold text-base-content mb-2">Find Us</h4>
              <p className="text-base-content/70">Mobile food truck serving the community daily</p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-lg font-semibold text-base-content mb-2">Quality First</h4>
              <p className="text-base-content/70">Made with fresh ingredients and traditional recipes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-base-content mb-4">
            Ready to Order?
          </h3>
          <p className="text-xl text-base-content/80 mb-8">
            Browse our full menu and place your order today
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-content px-8"
            onClick={() => setLocation('/menu')}
          >
            See Full Menu
          </Button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral border-t border-base-200 shadow-lg z-50">
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <button
            onClick={() => setLocation('/')}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-accent bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => setLocation('/menu')}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-neutral-content hover:text-accent hover:bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
          
          <button
            onClick={() => window.open('tel:+1234567890')}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-neutral-content hover:text-accent hover:bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <Phone className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Call</span>
          </button>
          
          <button
            onClick={() => {
              const locationElement = document.querySelector('[data-location]');
              if (locationElement) {
                locationElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-neutral-content hover:text-accent hover:bg-accent/10 transition-colors duration-200 min-w-[60px]"
          >
            <MapPin className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Location</span>
          </button>
        </div>
      </div>
    </>
  );
}