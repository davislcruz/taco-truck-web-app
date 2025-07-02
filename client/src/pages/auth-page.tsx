import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChefHat, Utensils, ClipboardList } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  const onLogin = async (data: LoginFormData) => {
    try {
      const user = await loginMutation.mutateAsync(data);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      // Redirect owners to dashboard, employees to home page
      if (user.role === "owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/");
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-mexican-red rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold dark-gray">La Charreada</h1>
            <p className="text-gray-600">Staff Access Portal</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-mexican-red hover:bg-red-600"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-mexican-red relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700" />
        <div className="relative flex items-center justify-center text-center text-white p-12">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">
              Authentic Mexican Cuisine
            </h2>
            <p className="text-xl mb-8 text-red-100">
              Manage your restaurant with our comprehensive dashboard
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="mb-2">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div className="font-semibold">Order Management</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="mb-2">
                  <Utensils className="h-6 w-6 text-white" />
                </div>
                <div className="font-semibold">Menu Control</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}