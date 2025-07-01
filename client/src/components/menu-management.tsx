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
import { MenuItem, InsertMenuItem, Category, InsertCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  translation: z.string().min(1, "Translation is required"),
  icon: z.string().min(1, "Icon is required"),
  order: z.number().min(0),
});

const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  translation: z.string().min(1, "Translation is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  meats: z.string().optional(),
  toppings: z.string().optional(),
  sizes: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;
type MenuItemFormData = z.infer<typeof menuItemFormSchema>;

export default function MenuManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      translation: "",
      category: "",
      price: "",
      description: "",
      image: "",
      meats: "",
      toppings: "",
      sizes: "",
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      translation: "",
      icon: "",
      order: 0,
    },
  });

  // Menu item mutations
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

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created successfully!" });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCategory }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated successfully!" });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Menu item handlers
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
      category: item.category,
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

  // Category handlers
  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      translation: category.translation,
      icon: category.icon,
      order: category.order,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category? This will affect all menu items in this category.")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleCategoryDialogClose = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
    categoryForm.reset();
  };

  const categoryLabels = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.translation;
    return acc;
  }, {} as Record<string, string>);

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <div className="space-x-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Name (ID)</Label>
                  <Input
                    id="category-name"
                    placeholder="e.g., tacos, burritos"
                    {...categoryForm.register("name")}
                  />
                  {categoryForm.formState.errors.name && (
                    <p className="text-sm text-red-600">{categoryForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category-translation">Display Name</Label>
                  <Input
                    id="category-translation"
                    placeholder="e.g., Tacos, Burritos"
                    {...categoryForm.register("translation")}
                  />
                  {categoryForm.formState.errors.translation && (
                    <p className="text-sm text-red-600">{categoryForm.formState.errors.translation.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category-icon">Icon (Emoji)</Label>
                  <Input
                    id="category-icon"
                    placeholder="🌮"
                    {...categoryForm.register("icon")}
                  />
                  {categoryForm.formState.errors.icon && (
                    <p className="text-sm text-red-600">{categoryForm.formState.errors.icon.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category-order">Display Order</Label>
                  <Input
                    id="category-order"
                    type="number"
                    {...categoryForm.register("order", { valueAsNumber: true })}
                  />
                  {categoryForm.formState.errors.order && (
                    <p className="text-sm text-red-600">{categoryForm.formState.errors.order.message}</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleCategoryDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-mexican-green hover:bg-green-600"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
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
                  <Select onValueChange={(value) => form.setValue("category", value)} value={form.watch("category")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.icon} {category.translation}
                        </SelectItem>
                      ))}
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
                    placeholder="12.99"
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
                    placeholder="Brief description of the dish"
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
                  <Label htmlFor="meats">Available Meats (comma-separated)</Label>
                  <Input
                    id="meats"
                    {...form.register("meats")}
                    placeholder="Carnitas, Al Pastor, Carne Asada"
                  />
                </div>

                <div>
                  <Label htmlFor="toppings">Available Toppings (comma-separated)</Label>
                  <Input
                    id="toppings"
                    {...form.register("toppings")}
                    placeholder="Onions, Cilantro, Salsa Verde"
                  />
                </div>

                <div>
                  <Label htmlFor="sizes">Available Sizes (comma-separated)</Label>
                  <Input
                    id="sizes"
                    {...form.register("sizes")}
                    placeholder="Small, Medium, Large"
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-mexican-green hover:bg-green-600"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Categories
            <span className="text-sm font-normal text-gray-500">
              {categories.length} categories
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-medium">{category.translation}</div>
                    <div className="text-sm text-gray-500">ID: {category.name} • Order: {category.order}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && !categoriesLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No categories found. Add your first category!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Items Section */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {categoryLabels[category] || category} ({items.length})
          </h3>
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-4 flex-1">
                      {/* Food Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge variant="outline">${parseFloat(item.price).toFixed(2)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{item.translation}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {menuItems.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found. Add your first item!</p>
        </div>
      )}
    </div>
  );
}