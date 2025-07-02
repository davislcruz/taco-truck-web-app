import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Search, LogOut, Clock, Phone, FileText, Menu, ChefHat, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import MenuManagement from "@/components/menu-management";
import { useLocation } from "wouter";

export default function OwnerDashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
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
      case "received": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-yellow-100 text-yellow-800";
      case "ready": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold">Order #{order.orderId}</h4>
            <p className="text-sm text-gray-600 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {order.phone}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-500 mb-2 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(order.timestamp).toLocaleString()}
        </div>
        
        <div className="mb-2">
          <strong>Items:</strong>
          <div className="text-sm text-gray-600 ml-2">
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
            <strong>Instructions:</strong>
            <p className="text-sm text-gray-600">{order.instructions}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="font-bold">Total: ${order.total}</span>
          <div className="flex space-x-2">
            {order.status === "received" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(order.orderId, "preparing")}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Start Preparing
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(order.orderId, "ready")}
                className="bg-green-500 hover:bg-green-600"
              >
                Mark Ready
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(order.orderId, "completed")}
                className="bg-gray-500 hover:bg-gray-600"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mexican-red rounded-full flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold dark-gray">La Charreada</h1>
                <p className="text-sm text-gray-500">Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="mr-2"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Customer Page
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Orders Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by phone number or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {isLoading ? (
                    <div>Loading orders...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No orders found
                    </div>
                  ) : (
                    filteredOrders.map(renderOrderCard)
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="menu" className="space-y-4">
            <MenuManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}