
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { MenuItem, InsertMenuItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  translation: z.string().min(1, "Translation is required"),
  category: z.enum(["tacos", "burritos", "tortas", "semitas", "drinks"]),
  price: z.string().min(1, "Price is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  meats: z.string().optional(),
  toppings: z.string().optional(),
  sizes: z.string().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemFormSchema>;

export default function MenuManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      translation: "",
      category: "tacos",
      price: "",
      description: "",
      image: "",
      meats: "",
      toppings: "",
      sizes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMenuItem) => {
      const response = await apiRequest("POST", "/api/menu", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu item created successfully!" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertMenuItem }) => {
      const response = await apiRequest("PUT", `/api/menu/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu item updated successfully!" });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu item deleted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MenuItemFormData) => {
    const processedData: InsertMenuItem = {
      ...data,
      meats: data.meats ? data.meats.split(",").map(m => m.trim()) : undefined,
      toppings: data.toppings ? data.toppings.split(",").map(t => t.trim()) : undefined,
      sizes: data.sizes ? data.sizes.split(",").map(s => s.trim()) : undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      translation: item.translation,
      category: item.category as any,
      price: item.price,
      description: item.description || "",
      image: item.image || "",
      meats: item.meats?.join(", ") || "",
      toppings: item.toppings?.join(", ") || "",
      sizes: item.sizes?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const categoryLabels: Record<string, string> = {
    tacos: "Tacos",
    burritos: "Burritos",
    tortas: "Tortas",
    semitas: "Semitas",
    drinks: "Bebidas",
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-mexican-green hover:bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name (Spanish)</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g., De Carnitas"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="translation">Translation (English)</Label>
                <Input
                  id="translation"
                  {...form.register("translation")}
                  placeholder="e.g., Pulled Pork Tacos"
                />
                {form.formState.errors.translation && (
                  <p className="text-sm text-red-600">{form.formState.errors.translation.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tacos">Tacos</SelectItem>
                    <SelectItem value="burritos">Burritos</SelectItem>
                    <SelectItem value="tortas">Tortas</SelectItem>
                    <SelectItem value="semitas">Semitas</SelectItem>
                    <SelectItem value="drinks">Bebidas</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  {...form.register("price")}
                  placeholder="e.g., 12.99"
                  type="number"
                  step="0.01"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Brief description of the item"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  {...form.register("image")}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="meats">Available Meats (comma separated)</Label>
                <Input
                  id="meats"
                  {...form.register("meats")}
                  placeholder="e.g., Carnitas, Asada, Pollo"
                />
              </div>

              <div>
                <Label htmlFor="toppings">Available Toppings (comma separated)</Label>
                <Input
                  id="toppings"
                  {...form.register("toppings")}
                  placeholder="e.g., Cilantro, Onions, Salsa Verde"
                />
              </div>

              <div>
                <Label htmlFor="sizes">Available Sizes (comma separated)</Label>
                <Input
                  id="sizes"
                  {...form.register("sizes")}
                  placeholder="e.g., Small, Medium, Large"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-mexican-green hover:bg-green-600"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3 mexican-red">
            {categoryLabels[category] || category} ({items.length})
          </h3>
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <Badge variant="outline">${parseFloat(item.price).toFixed(2)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.translation}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 text-xs">
                        {item.meats && item.meats.length > 0 && (
                          <Badge variant="secondary">Meats: {item.meats.join(", ")}</Badge>
                        )}
                        {item.sizes && item.sizes.length > 0 && (
                          <Badge variant="secondary">Sizes: {item.sizes.join(", ")}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {menuItems.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found. Add your first item!</p>
        </div>
      )}
    </div>
  )
}
