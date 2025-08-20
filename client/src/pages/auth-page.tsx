import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/use-branding";
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
  const { restaurantName } = useBranding();

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
    <div className="min-h-screen bg-base-300 flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="avatar mb-4">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-accent-content" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-base-content">{restaurantName}</h1>
            <p className="text-base-content/70">Staff Access Portal</p>
          </div>

          <Card className="card bg-base-200 shadow-xl">
            <CardHeader className="card-body pb-4">
              <CardTitle className="card-title text-base-content">Login</CardTitle>
              <CardDescription className="text-base-content/60">
                Access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="card-body pt-0">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="form-control w-full">
                  <Label htmlFor="username" className="label">
                    <span className="label-text">Username</span>
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="input input-bordered w-full"
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {loginForm.formState.errors.username.message}
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-control w-full">
                  <Label htmlFor="password" className="label">
                    <span className="label-text">Password</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="input input-bordered w-full"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {loginForm.formState.errors.password.message}
                      </span>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="btn btn-primary w-full"
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
      <div className="hidden lg:flex lg:flex-1 bg-primary relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-focus" />
        <div className="relative flex items-center justify-center text-center text-primary-content p-12">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">
              Authentic Mexican Cuisine
            </h2>
            <p className="text-xl mb-8 text-primary-content/80">
              Manage your restaurant with our comprehensive dashboard
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="card bg-base-100/10 p-4">
                <div className="mb-2">
                  <ClipboardList className="h-6 w-6 text-primary-content" />
                </div>
                <div className="font-semibold">Order Management</div>
              </div>
              <div className="card bg-base-100/10 p-4">
                <div className="mb-2">
                  <Utensils className="h-6 w-6 text-primary-content" />
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