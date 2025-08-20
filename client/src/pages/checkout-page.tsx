import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/use-branding";
import { Loader2, ArrowLeft, CreditCard, ChefHat } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock_key');

const checkoutSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  instructions: z.string().optional(),
  cardNumber: z.string().min(16, "Card number must be at least 16 digits"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format"),
  cvv: z.string().min(3, "CVV must be at least 3 digits"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { restaurantName } = useBranding();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  // Mock cart data - in real app this would come from context/state
  const mockCart = [
    {
      id: "1",
      name: "Tacos de Carnitas",
      translation: "Pulled Pork Tacos",
      quantity: 2,
      price: 12.99,
      selectedMeat: "Carnitas",
      selectedIngredients: ["Cilantro", "Salsa Verde"]
    },
    {
      id: "2", 
      name: "Agua de Jamaica",
      translation: "Hibiscus Water",
      quantity: 1,
      price: 3.99,
      selectedSize: "Medium"
    }
  ];

  const total = mockCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      phone: "",
      instructions: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    },
  });

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: total 
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        if (data.message) {
          toast({
            title: "Development Mode",
            description: data.message,
            variant: "default",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to initialize payment",
          variant: "destructive",
        });
      }
    };

    if (total > 0) {
      createPaymentIntent();
    }
  }, [total, toast]);

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    
    try {
      // Create order
      const orderData = {
        orderId: `ORD-${Date.now()}`,
        phone: data.phone,
        items: mockCart,
        instructions: data.instructions || "",
        total: total.toString(),
        status: "received",
        estimatedTime: 20,
      };

      await apiRequest("POST", "/api/orders", orderData);

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${orderData.orderId} has been received. You'll get SMS updates.`,
      });

      // Redirect to home page
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-300">
      {/* Header */}
      <header className="navbar bg-base-200 shadow border-b border-base-100">
        <div className="navbar-start">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="btn btn-ghost flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Menu</span>
          </Button>
        </div>
        <div className="navbar-end">
          <div className="flex items-center space-x-3">
            <div className="avatar">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <ChefHat className="h-4 w-4 text-accent-content" />
              </div>
            </div>
            <span className="font-bold text-base-content">{restaurantName}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className="card bg-base-100 shadow-xl">
              <CardHeader className="card-body pb-4">
                <CardTitle className="card-title text-base-content">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="card-body pt-0 space-y-4">
                {mockCart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-base-content">{item.name}</h4>
                      <p className="text-sm text-base-content/70">{item.translation}</p>
                      {item.selectedMeat && (
                        <p className="text-xs text-base-content/60">Meat: {item.selectedMeat}</p>
                      )}
                      {item.selectedSize && (
                        <p className="text-xs text-base-content/60">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedIngredients && item.selectedIngredients.length > 0 && (
                        <p className="text-xs text-base-content/60">
                          Ingredients: {item.selectedIngredients.join(", ")}
                        </p>
                      )}
                      <p className="text-sm text-base-content/70">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-base-content">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-base-content">Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card className="card bg-base-100 shadow-xl">
              <CardHeader className="card-body pb-4">
                <CardTitle className="card-title text-base-content flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Checkout</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="card-body pt-0">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="form-control w-full">
                      <Label htmlFor="phone" className="label">
                        <span className="label-text">Phone Number *</span>
                      </Label>
                      <Input
                        id="phone"
                        {...form.register("phone")}
                        placeholder="(555) 123-4567"
                        className="input input-bordered w-full"
                      />
                      <div className="label">
                        <span className="label-text-alt text-base-content/60">We'll text you order updates</span>
                      </div>
                      {form.formState.errors.phone && (
                        <div className="label">
                          <span className="label-text-alt text-error">
                            {form.formState.errors.phone.message}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <Label htmlFor="instructions" className="label">
                        <span className="label-text">Special Instructions (Optional)</span>
                      </Label>
                      <p className="text-xs text-base-content/70 mb-2">Share any <strong className="text-base-content">special requests</strong>, dietary restrictions, or preferences for your order.</p>
                      <Textarea
                        id="instructions"
                        {...form.register("instructions")}
                        placeholder="Example: Extra spicy, no onions, gluten-free options..."
                        className="textarea textarea-bordered w-full"
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-base-content">Payment Information</h3>
                      <div className="space-y-4">
                        <div className="form-control w-full">
                          <Label htmlFor="cardNumber" className="label">
                            <span className="label-text">Card Number *</span>
                          </Label>
                          <Input
                            id="cardNumber"
                            {...form.register("cardNumber")}
                            placeholder="1234 5678 9012 3456"
                            className="input input-bordered w-full"
                          />
                          {form.formState.errors.cardNumber && (
                            <div className="label">
                              <span className="label-text-alt text-error">
                                {form.formState.errors.cardNumber.message}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="form-control w-full">
                            <Label htmlFor="expiry" className="label">
                              <span className="label-text">Expiry *</span>
                            </Label>
                            <Input
                              id="expiry"
                              {...form.register("expiry")}
                              placeholder="MM/YY"
                              className="input input-bordered w-full"
                            />
                            {form.formState.errors.expiry && (
                              <div className="label">
                                <span className="label-text-alt text-error">
                                  {form.formState.errors.expiry.message}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="form-control w-full">
                            <Label htmlFor="cvv" className="label">
                              <span className="label-text">CVV *</span>
                            </Label>
                            <Input
                              id="cvv"
                              {...form.register("cvv")}
                              placeholder="123"
                              className="input input-bordered w-full"
                            />
                            {form.formState.errors.cvv && (
                              <div className="label">
                                <span className="label-text-alt text-error">
                                  {form.formState.errors.cvv.message}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="btn btn-success w-full font-semibold py-4"
                      disabled={isProcessing}
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <CreditCard className="mr-2 h-4 w-4" />
                      Place Order - ${total.toFixed(2)}
                    </Button>
                  </form>
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
