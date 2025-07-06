import { useState, useMemo } from "react";
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Utensils } from "lucide-react";
import { MenuItem, InsertMenuItem, Category, InsertCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCategoryIcon } from "@/lib/menu-data";
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
  const [inlineEditing, setInlineEditing] = useState<{[key: string]: boolean}>({});
  const [tempValues, setTempValues] = useState<{[key: string]: any}>({});
  const [editMode, setEditMode] = useState<{[key: number]: boolean}>({});
  const [lastInsertedItem, setLastInsertedItem] = useState<{ id: number, insertAfterIndex: number, category: string } | null>(null);

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
    mutationFn: async (data: InsertMenuItem & { insertAfterIndex?: number }) => {
      // Remove insertAfterIndex from the data sent to server
      const { insertAfterIndex, ...serverData } = data;
      const response = await apiRequest("POST", "/api/menu", serverData);
      const newItem = await response.json();
      
      // Store insertion context with the new item
      if (typeof insertAfterIndex === 'number') {
        setLastInsertedItem({
          id: newItem.id,
          insertAfterIndex,
          category: data.category
        });
      }
      
      return newItem;
    },
    onSuccess: (newItem: MenuItem) => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu item created successfully!" });
      setIsDialogOpen(false);
      form.reset();
      
      // Automatically put new item in edit mode if it was created via plus button
      if (newItem.name === "New Item" && newItem.translation === "Click to edit") {
        setEditMode(prev => ({ ...prev, [newItem.id]: true }));
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create menu item",
        description: error.message,
        variant: "destructive",
      });
      setLastInsertedItem(null);
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
    if (confirm("Are you sure you want to delete this category? Note: You cannot delete a category that still contains menu items.")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Inline editing functions
  const startInlineEdit = (itemId: number, field: string, currentValue: any) => {
    if (!editMode[itemId]) return; // Only allow editing if edit mode is enabled for this item
    const key = `${itemId}-${field}`;
    setInlineEditing(prev => ({ ...prev, [key]: true }));
    setTempValues(prev => ({ ...prev, [key]: currentValue }));
  };

  const cancelInlineEdit = (itemId: number, field: string) => {
    const key = `${itemId}-${field}`;
    setInlineEditing(prev => ({ ...prev, [key]: false }));
    setTempValues(prev => ({ ...prev, [key]: undefined }));
  };

  const saveInlineEdit = (itemId: number, field: string) => {
    const key = `${itemId}-${field}`;
    const newValue = tempValues[key];
    const item = menuItems.find(item => item.id === itemId);
    
    if (item && newValue !== undefined && newValue !== item[field as keyof MenuItem]) {
      const updatedData = { ...item, [field]: newValue };
      updateMutation.mutate({ id: itemId, data: updatedData });
    }
    
    setInlineEditing(prev => ({ ...prev, [key]: false }));
    setTempValues(prev => ({ ...prev, [key]: undefined }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, itemId: number, field: string) => {
    if (e.key === 'Enter') {
      saveInlineEdit(itemId, field);
    } else if (e.key === 'Escape') {
      cancelInlineEdit(itemId, field);
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

  const groupedItems = useMemo(() => {
    const grouped = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Sort items within each category and handle positional insertion
    Object.keys(grouped).forEach(category => {
      const items = grouped[category];
      
      // Check if we have a recently inserted item for this category
      if (lastInsertedItem && lastInsertedItem.category === category) {
        // Find the inserted item
        const insertedItem = items.find(item => item.id === lastInsertedItem.id);
        
        if (insertedItem) {
          // Remove the inserted item from its current position
          const otherItems = items.filter(item => item.id !== lastInsertedItem.id);
          
          // Insert it at the desired position
          let insertAtIndex;
          if (lastInsertedItem.insertAfterIndex === -1) {
            // Insert at the beginning
            insertAtIndex = 0;
          } else {
            // Insert after the specified index
            insertAtIndex = Math.min(lastInsertedItem.insertAfterIndex + 1, otherItems.length);
          }
          otherItems.splice(insertAtIndex, 0, insertedItem);
          
          grouped[category] = otherItems;
          
          // Clear the insertion state after applying it (in a timeout to avoid infinite loops)
          setTimeout(() => setLastInsertedItem(null), 0);
        }
      } else {
        // Normal sorting by ID for creation order
        items.sort((a, b) => a.id - b.id);
      }
    });
    
    return grouped;
  }, [menuItems, lastInsertedItem]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <div className="space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                        <div key={category.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-50">
                          <SelectItem value={category.name} className="flex-1">
                            <div className="flex items-center">
                              {React.createElement(getCategoryIcon(category.icon), { className: "h-4 w-4 mr-2" })}
                              {category.translation}
                            </div>
                          </SelectItem>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditCategory(category);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this category? Note: You cannot delete a category that still contains menu items.")) {
                                  handleDeleteCategory(category.id);
                                }
                              }}
                              disabled={deleteCategoryMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full justify-start text-left"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Add New Category
                        </Button>
                      </div>
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
                  <Label htmlFor="category-icon">Icon Name</Label>
                  <Input
                    id="category-icon"
                    placeholder="utensils, coffee, sandwich, etc."
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
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={handleCategoryDialogClose}>
                      Cancel
                    </Button>
                    {editingCategory && (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this category? Note: You cannot delete a category that still contains menu items.")) {
                            handleDeleteCategory(editingCategory.id);
                          }
                        }}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
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
        </div>
      </div>


      {/* Menu Items Section */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              {categoryLabels[category] || category} ({items.length})
            </h3>
            <div className="flex space-x-2">
              {/* Edit All Items in Category */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const categoryItems = items.map(item => item.id);
                  const hasAnyEditMode = categoryItems.some(id => editMode[id]);
                  const newEditMode = { ...editMode };
                  
                  categoryItems.forEach(id => {
                    newEditMode[id] = !hasAnyEditMode;
                  });
                  
                  setEditMode(newEditMode);
                  
                  if (!hasAnyEditMode) {
                    toast({
                      title: "Edit mode enabled",
                      description: `All ${category} items can now be edited`,
                      duration: 2000,
                    });
                  }
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              
              {/* Delete Category (if empty) */}
              {items.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    // Handle category deletion logic here
                    toast({
                      title: "Delete category",
                      description: "Category deletion functionality",
                      duration: 2000,
                    });
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {/* Plus button at the beginning when edit mode is active and category has items */}
            {items.length > 0 && items.some(i => editMode[i.id]) && (
              <div className="flex justify-center -mb-2 relative z-10">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0 rounded-full border-dashed border-gray-300 hover:border-mexican-green hover:bg-mexican-green/10 transition-colors bg-white shadow-sm"
                  onClick={() => {
                    // Create a new item at the beginning of the category
                    const placeholderItem = {
                      name: "New Item",
                      translation: "Click to edit",
                      category: category,
                      price: "0.00",
                      description: "Add description...",
                      image: "",
                      meats: [],
                      toppings: [],
                      sizes: [],
                      insertAfterIndex: -1, // Insert at the beginning
                    };
                    createMutation.mutate(placeholderItem);
                  }}
                  disabled={createMutation.isPending}
                >
                  <Plus className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
            )}
            
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {/* Plus button before each card (except first) when edit mode is active */}
                {index > 0 && items.some(i => editMode[i.id]) && (
                  <div className="flex justify-center -mt-2 -mb-2 relative z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 rounded-full border-dashed border-gray-300 hover:border-mexican-green hover:bg-mexican-green/10 transition-colors bg-white shadow-sm"
                      onClick={() => {
                        // Create a new item with placeholder data at specific position
                        const placeholderItem = {
                          name: "New Item",
                          translation: "Click to edit",
                          category: category,
                          price: "0.00",
                          description: "Add description...",
                          image: "",
                          meats: [],
                          toppings: [],
                          sizes: [],
                          insertAfterIndex: index - 1, // Insert after the previous item
                        };
                        createMutation.mutate(placeholderItem);
                      }}
                      disabled={createMutation.isPending}
                    >
                      <Plus className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                )}
                
                <Card className="group relative">
                  <CardContent className="p-4">
                    {/* Delete button in corner when edit mode is active */}
                    {editMode[item.id] && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border-red-200 w-8 h-8 p-0 rounded-full shadow-sm z-10"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <div className="flex space-x-4">
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
                            <Utensils className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {/* Editable Name */}
                          {inlineEditing[`${item.id}-name`] ? (
                            <Input
                              value={tempValues[`${item.id}-name`] || ''}
                              onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-name`]: e.target.value }))}
                              onKeyDown={(e) => handleKeyPress(e, item.id, 'name')}
                              onBlur={() => saveInlineEdit(item.id, 'name')}
                              className="font-semibold h-7 text-sm"
                              autoFocus
                            />
                          ) : (
                            <h4 
                              className={`font-semibold px-1 py-0.5 rounded transition-all ${
                                editMode[item.id] 
                                  ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50' 
                                  : 'cursor-default'
                              }`}
                              onClick={() => startInlineEdit(item.id, 'name', item.name)}
                            >
                              {item.name}
                            </h4>
                          )}
                          
                          {/* Editable Price */}
                          {inlineEditing[`${item.id}-price`] ? (
                            <Input
                              value={tempValues[`${item.id}-price`] || ''}
                              onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-price`]: e.target.value }))}
                              onKeyDown={(e) => handleKeyPress(e, item.id, 'price')}
                              onBlur={() => saveInlineEdit(item.id, 'price')}
                              className="h-7 text-sm w-20"
                              autoFocus
                            />
                          ) : (
                            <Badge 
                              variant="outline" 
                              className={`transition-all ${editMode[item.id] ? 'cursor-pointer hover:bg-gray-100 border-dashed border-blue-300 bg-blue-50' : 'cursor-default'}`}
                              onClick={() => startInlineEdit(item.id, 'price', item.price)}
                            >
                              ${parseFloat(item.price).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Editable Translation */}
                        {inlineEditing[`${item.id}-translation`] ? (
                          <Input
                            value={tempValues[`${item.id}-translation`] || ''}
                            onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-translation`]: e.target.value }))}
                            onKeyDown={(e) => handleKeyPress(e, item.id, 'translation')}
                            onBlur={() => saveInlineEdit(item.id, 'translation')}
                            className="text-sm h-7 mb-1"
                            autoFocus
                          />
                        ) : (
                          <p 
                            className={`text-sm text-gray-600 mb-1 px-1 py-0.5 rounded min-h-[20px] transition-all ${
                              editMode[item.id] 
                                ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50' 
                                : 'cursor-default'
                            }`}
                            onClick={() => startInlineEdit(item.id, 'translation', item.translation || '')}
                          >
                            {item.translation || 'Click to add translation...'}
                          </p>
                        )}
                        
                        {/* Editable Description */}
                        {inlineEditing[`${item.id}-description`] ? (
                          <Textarea
                            value={tempValues[`${item.id}-description`] || ''}
                            onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-description`]: e.target.value }))}
                            onKeyDown={(e) => handleKeyPress(e, item.id, 'description')}
                            onBlur={() => saveInlineEdit(item.id, 'description')}
                            className="text-xs h-16 resize-none"
                            autoFocus
                          />
                        ) : (
                          <p 
                            className={`text-xs text-gray-500 mb-2 px-1 py-0.5 rounded min-h-[20px] transition-all ${
                              editMode[item.id] 
                                ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50' 
                                : 'cursor-default'
                            }`}
                            onClick={() => startInlineEdit(item.id, 'description', item.description || '')}
                          >
                            {item.description || 'Click to add description...'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Plus button after last card when edit mode is active */}
                {index === items.length - 1 && items.some(i => editMode[i.id]) && (
                  <div className="flex justify-center -mt-2 pt-2 relative z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 rounded-full border-dashed border-gray-300 hover:border-mexican-green hover:bg-mexican-green/10 transition-colors bg-white shadow-sm"
                      onClick={() => {
                        // Create a new item with placeholder data at end of list
                        const placeholderItem = {
                          name: "New Item",
                          translation: "Click to edit",
                          category: category,
                          price: "0.00",
                          description: "Add description...",
                          image: "",
                          meats: [],
                          toppings: [],
                          sizes: [],
                          insertAfterIndex: index, // Insert after the current (last) item
                        };
                        createMutation.mutate(placeholderItem);
                      }}
                      disabled={createMutation.isPending}
                    >
                      <Plus className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                )}
              </React.Fragment>
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