import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Search, LogOut, Clock, Phone, FileText, Menu, ChefHat, ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/use-branding";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import MenuManagement from "@/components/menu-management";
import DaisyUIThemeSelector from "@/components/daisyui-theme-selector";
import { useLocation } from "wouter";

export default function OwnerDashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { restaurantName } = useBranding();
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest(`/api/orders/${orderId}/status`, "PATCH", {
        status,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const filteredOrders = orders?.filter((order: Order) =>
    order.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received": return "badge badge-info shadow";
      case "preparing": return "badge badge-warning shadow";
      case "ready": return "badge badge-success shadow";
      case "completed": return "badge badge-primary shadow";
      default: return "badge badge-neutral";
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4 hover-lift bg-base-100 border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-base-content">Order #{order.orderId}</h4>
            <p className="text-sm text-base-content/70 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {order.phone}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
        
        <div className="text-sm text-base-content/60 mb-2 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(order.timestamp).toLocaleString()}
        </div>
        
        <div className="mb-2">
          <strong className="text-base-content">Items:</strong>
          <div className="text-sm text-base-content/70 ml-2">
            {Array.isArray(order.items) ? order.items.map((item: any, index: number) => (
              <div key={index}>
                {item.quantity}x {item.name} - ${item.totalPrice}
              </div>
            )) : (
              <div>Invalid order format</div>
            )}
          </div>
        </div>
        
        {order.instructions && (
          <div className="mb-2">
            <strong className="text-base-content">Instructions:</strong>
            <p className="text-sm text-base-content/85 mt-1 italic">{order.instructions}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="font-bold text-base-content">Total: ${order.total}</span>
          <div className="flex space-x-2">
            {order.status === "received" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(order.orderId, "preparing")}
                className="btn btn-accent"
              >
                Start Preparing
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(order.orderId, "ready")}
                className="btn btn-accent"
              >
                Mark Ready
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(order.orderId, "completed")}
                className="btn btn-accent"
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-base-300">
      {/* Header */}
      <div className="bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-accent-content" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-content drop-shadow-sm">{restaurantName}</h1>
                <p className="text-sm text-primary-content/90">Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.setItem("allowOwnerHomepage", "true");
                  setLocation("/");
                }}
                className="mr-2 bg-primary-content/10 hover:bg-primary-content/20 text-primary-content border-primary-content/30 hover:border-primary-content/50 backdrop-blur"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="bg-primary-content/10 hover:bg-primary-content/20 text-primary-content border-primary-content/30 hover:border-primary-content/50 backdrop-blur"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="w-full bg-base-200 p-1">
            <TabsTrigger value="orders" className="flex-1 gap-2">
              <FileText className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 gap-2">
              <Menu className="h-4 w-4" />
              Menu Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          {/* Only render the active tab panel */}
          {/** Tab logic for unmounting inactive panels **/}
          {/** Orders Tab **/}
          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-base-100 border-0 shadow-xl">
              <CardHeader className="bg-secondary text-secondary-content rounded-t-lg">
                <CardTitle className="flex items-center text-secondary-content">
                  <FileText className="h-5 w-5 mr-2" />
                  Orders Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 h-4 w-4" />
                    <Input
                      placeholder="Search by phone number or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input input-bordered pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-base-content">Loading orders...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                      No orders found
                    </div>
                  ) : (
                    filteredOrders.map(renderOrderCard)
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/** Menu Management Tab **/}
          <TabsContent value="menu" className="space-y-4">
            <MenuManagement />
          </TabsContent>
          {/** Settings Tab **/}
          <TabsContent value="settings" className="space-y-6">
            <DaisyUIThemeSelector />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}