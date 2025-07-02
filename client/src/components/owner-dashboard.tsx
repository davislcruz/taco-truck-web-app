import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Search, LogOut, Clock, Phone, FileText, Menu, ChefHat } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MenuManagement from "@/components/menu-management";

interface OwnerDashboardProps {
  onClose: () => void;
}

export default function OwnerDashboard({ onClose }: OwnerDashboardProps) {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [searchPhone, setSearchPhone] = useState("");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Updated",
        description: `Order ${updatedOrder.orderId} marked as ${updatedOrder.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      onClose();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const filteredOrders = searchPhone 
    ? orders.filter(order => order.phone.includes(searchPhone))
    : orders;

  const currentOrders = filteredOrders.filter(order => order.status !== 'completed');
  const completedOrders = filteredOrders.filter(order => order.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-lg">{order.orderId}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
              <Phone className="h-4 w-4" />
              <span>{order.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(order.timestamp)}</span>
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          {Array.isArray(order.items) ? order.items.map((item: any, index: number) => (
            <div key={index} className="text-sm">
              <strong>{item.quantity}x {item.name}</strong>
              {item.selectedMeat && (
                <span className="text-gray-500 ml-2">- {item.selectedMeat}</span>
              )}
              {item.selectedSize && (
                <span className="text-gray-500 ml-2">({item.selectedSize})</span>
              )}
            </div>
          )) : (
            <div className="text-sm text-gray-500">Order items unavailable</div>
          )}
        </div>

        {order.instructions && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <strong>Notes:</strong>
            </div>
            <p className="text-sm text-gray-600 mt-1 pl-6">{order.instructions}</p>
          </div>
        )}

        <Separator className="my-3" />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg mexican-red">
            ${parseFloat(order.total).toFixed(2)}
          </span>
          
          {order.status !== 'completed' && (
            <div className="space-x-2">
              {order.status === 'received' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                  onClick={() => handleStatusUpdate(order.orderId, 'started')}
                  disabled={updateStatusMutation.isPending}
                >
                  Start Cooking
                </Button>
              )}
              <Button
                size="sm"
                className="bg-mexican-green hover:bg-green-600 text-white"
                onClick={() => handleStatusUpdate(order.orderId, 'completed')}
                disabled={updateStatusMutation.isPending}
              >
                Mark Complete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
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
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by phone number..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="orders" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center space-x-2">
                <Menu className="h-4 w-4" />
                <span>Menu Management</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Orders */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 mexican-red flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Current Orders ({currentOrders.length})
                  </h2>
                  <div className="space-y-4">
                    {currentOrders.length > 0 ? (
                      currentOrders.map(renderOrderCard)
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No current orders</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed Orders */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 mexican-green flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Recent Completed ({completedOrders.slice(0, 10).length})
                  </h2>
                  <div className="space-y-4">
                    {completedOrders.slice(0, 10).length > 0 ? (
                      completedOrders.slice(0, 10).map(renderOrderCard)
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No completed orders</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="menu" className="mt-6">
              <MenuManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
