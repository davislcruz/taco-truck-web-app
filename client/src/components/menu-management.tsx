import { useState, useMemo, useEffect } from "react";
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
import { Plus, Edit, Trash2, X, Utensils, Camera, ChevronDown, GlassWater, ChevronUp, ChevronDown as ChevronDownIcon } from "lucide-react";
import { MenuItem, InsertMenuItem, Category, InsertCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCategoryIcon } from "@/lib/menu-data";
import { generateSlug } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categoryFormSchema = z.object({
  translation: z.string().min(1, "Display name is required"),
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
  const [customOrder, setCustomOrder] = useState<Record<string, number[]>>({});
  const [expandedItems, setExpandedItems] = useState<{[key: number]: boolean}>({});
  // Initialize all categories as expanded by default
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [categoryOrderList, setCategoryOrderList] = useState<Array<{id: string, name: string, icon: string, isNew?: boolean}>>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [justCreatedCategory, setJustCreatedCategory] = useState<string | null>(null);

  // Toggle item expansion
  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Initialize category order list when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
      setCategoryOrderList(sortedCategories.map(cat => ({
        id: cat.name,
        name: cat.translation,
        icon: cat.icon
      })));
    }
  }, [categories]);



  // Functions to handle category reordering
  const moveCategoryUp = (index: number) => {
    if (index > 0) {
      const newList = [...categoryOrderList];
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
      setCategoryOrderList(newList);
    }
  };

  const moveCategoryDown = (index: number) => {
    if (index < categoryOrderList.length - 1) {
      const newList = [...categoryOrderList];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      setCategoryOrderList(newList);
    }
  };

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  // Auto-enable edit mode for newly created category items
  useEffect(() => {
    if (justCreatedCategory && menuItems && menuItems.length > 0) {
      const newCategoryItems = menuItems.filter(item => item.category === justCreatedCategory);
      
      if (newCategoryItems.length > 0) {
        newCategoryItems.forEach(item => {
          setEditMode(prev => ({ ...prev, [item.id]: true }));
          setExpandedItems(prev => ({ ...prev, [item.id]: true }));
        });
        // Clear the flag after processing
        setJustCreatedCategory(null);
      }
    }
  }, [menuItems, justCreatedCategory]);

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
      translation: "",
      icon: "utensils",
      order: 0,
    },
  });

  // Update category order list when new category name changes
  useEffect(() => {
    const translation = categoryForm.watch("translation");
    const icon = categoryForm.watch("icon");
    
    if (translation && translation.trim()) {
      const newId = generateSlug(translation);
      
      setCategoryOrderList(prev => {
        // Check if a new category already exists
        const existingNewIndex = prev.findIndex(cat => cat.isNew);
        
        if (existingNewIndex >= 0) {
          // Update existing new category in place, preserving its position
          const updated = [...prev];
          updated[existingNewIndex] = {
            id: newId,
            name: translation,
            icon: icon || "utensils",
            isNew: true
          };
          return updated;
        } else {
          // Add new category at the beginning only if it doesn't exist
          const withoutNew = prev.filter(cat => !cat.isNew);
          return [
            {
              id: newId,
              name: translation,
              icon: icon || "utensils",
              isNew: true
            },
            ...withoutNew
          ];
        }
      });
    } else {
      // Remove new category if name is cleared
      setCategoryOrderList(prev => prev.filter(cat => !cat.isNew));
    }
  }, [categoryForm.watch("translation"), categoryForm.watch("icon")]);

  // Menu item mutations
  const createMutation = useMutation({
    mutationFn: async (data: InsertMenuItem & { insertAfterIndex?: number }) => {
      // Remove insertAfterIndex from the data sent to server
      const { insertAfterIndex, ...serverData } = data;
      const response = await apiRequest("POST", "/api/menu", serverData);
      const newItem = await response.json();
      
      // Update custom order if insertion position was specified
      if (typeof insertAfterIndex === 'number') {
        setCustomOrder(prev => {
          const categoryOrder = prev[data.category] || [];
          
          // If no custom order exists yet, we need to build it from the existing items
          if (categoryOrder.length === 0) {
            // Get current menu items for this category (excluding the new item)
            const currentCategoryItems = menuItems
              .filter(item => item.category === data.category)
              .sort((a, b) => a.id - b.id)
              .map(item => item.id);
            
            let newOrder = [...currentCategoryItems];
            
            if (insertAfterIndex === -1) {
              // Insert at beginning
              newOrder.unshift(newItem.id);
            } else {
              // Insert after the specified index
              const insertAt = Math.min(insertAfterIndex + 1, newOrder.length);
              newOrder.splice(insertAt, 0, newItem.id);
            }
            
            return {
              ...prev,
              [data.category]: newOrder
            };
          } else {
            // Use existing custom order
            const newOrder = [...categoryOrder];
            
            if (insertAfterIndex === -1) {
              // Insert at beginning
              newOrder.unshift(newItem.id);
            } else {
              // Insert after the specified index
              const insertAt = Math.min(insertAfterIndex + 1, newOrder.length);
              newOrder.splice(insertAt, 0, newItem.id);
            }
            
            return {
              ...prev,
              [data.category]: newOrder
            };
          }
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
      return id;
    },
    onSuccess: (deletedId: number) => {
      // Clean up custom order
      setCustomOrder(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].filter(itemId => itemId !== deletedId);
        });
        return updated;
      });
      
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
      const category = await response.json();
      
      // Automatically create a placeholder menu item for the new category
      const placeholderItem = {
        name: "New Item",
        translation: "Click to edit",
        category: category.name,
        price: "0.00",
        description: "Add description...",
        image: "",
        meats: [],
        toppings: [],
        sizes: []
      };
      
      await apiRequest("POST", "/api/menu", placeholderItem);
      return category;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Category created with starter item!" });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      
      // Flag this category for auto-edit mode when menu items load
      setJustCreatedCategory(newCategory.name);
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
    // Auto-generate the name (slug) from the display name
    const categoryData = {
      name: generateSlug(data.translation),
      translation: data.translation,
      icon: data.icon,
      order: data.order
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      // For new categories, use the position in the visual order list
      const newCategoryIndex = categoryOrderList.findIndex(cat => cat.isNew);
      const finalOrder = newCategoryIndex >= 0 ? newCategoryIndex : categoryOrderList.length;
      
      const finalData = {
        ...categoryData,
        order: finalOrder
      };
      
      createCategoryMutation.mutate(finalData);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
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

  const handleCategoryDialogClose = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
    categoryForm.reset();
    // Reset the category order list to remove any "new" items
    setCategoryOrderList(prev => prev.filter(cat => !cat.isNew));
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

    // Sort items within each category using custom order or default ID order
    Object.keys(grouped).forEach(category => {
      const items = grouped[category];
      const categoryOrder = customOrder[category];
      
      if (categoryOrder && categoryOrder.length > 0) {
        // Use custom order if available
        const orderedItems: MenuItem[] = [];
        const remainingItems = [...items];
        
        // First, add items in the specified order
        categoryOrder.forEach(itemId => {
          const itemIndex = remainingItems.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            orderedItems.push(remainingItems.splice(itemIndex, 1)[0]);
          }
        });
        
        // Then add any remaining items (not in custom order) at the end
        remainingItems.sort((a, b) => a.id - b.id);
        orderedItems.push(...remainingItems);
        
        grouped[category] = orderedItems;
      } else {
        // Default sorting by ID for creation order
        items.sort((a, b) => a.id - b.id);
      }
    });
    
    return grouped;
  }, [menuItems, customOrder]);

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
            <DialogContent className="max-w-md h-[700px] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Create a new menu category"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="category-translation">Category Name</Label>
                    <Input
                      id="category-translation"
                      placeholder="e.g., Tacos, Burritos, Bebidas Especiales"
                      {...categoryForm.register("translation")}
                    />
                    {categoryForm.formState.errors.translation && (
                      <p className="text-sm text-red-600">{categoryForm.formState.errors.translation.message}</p>
                    )}
                  </div>
                  <div className="w-32">
                    <Label htmlFor="category-icon">Category Type</Label>
                    <Select 
                      value={categoryForm.watch("icon")} 
                      onValueChange={(value) => categoryForm.setValue("icon", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type">
                          {categoryForm.watch("icon") && (
                            <div className="flex items-center space-x-1">
                              {categoryForm.watch("icon") === "utensils" ? (
                                <>
                                  <Utensils className="h-4 w-4" />
                                  <span>Food</span>
                                </>
                              ) : (
                                <>
                                  <GlassWater className="h-4 w-4" />
                                  <span>Drinks</span>
                                </>
                              )}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utensils">
                          <div className="flex items-center space-x-2">
                            <Utensils className="h-4 w-4" />
                            <span>Food</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="glass-water">
                          <div className="flex items-center space-x-2">
                            <GlassWater className="h-4 w-4" />
                            <span>Drinks</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {categoryForm.formState.errors.icon && (
                      <p className="text-sm text-red-600">{categoryForm.formState.errors.icon.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Category Display Order</Label>
                  <div className="border rounded-lg p-3 max-h-96 overflow-y-auto bg-gray-50">
                    <p className="text-xs text-gray-600 mb-3">
                      Preview your category order below. Use ↑↓ arrows to reorder. Click "Create" to save the highlighted category to your menu.
                    </p>
                    {categoryOrderList.length > 0 ? (
                      <div className="space-y-2">
                        {categoryOrderList.map((cat, index) => (
                          <div 
                            key={cat.id} 
                            className={`flex items-center justify-between p-2 rounded border transition-all duration-300 ${
                              cat.isNew 
                                ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-200 ring-opacity-50' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-500 w-6">
                                {index + 1}.
                              </span>
                              <div className="flex items-center space-x-2">
                                {cat.icon === "utensils" ? (
                                  <Utensils className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <GlassWater className="h-4 w-4 text-gray-600" />
                                )}
                                <span className={`text-sm ${cat.isNew ? 'font-semibold text-blue-800' : 'text-gray-700'}`}>
                                  {cat.name}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-7 h-7 p-0"
                                onClick={() => moveCategoryUp(index)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-7 h-7 p-0"
                                onClick={() => moveCategoryDown(index)}
                                disabled={index === categoryOrderList.length - 1}
                              >
                                <ChevronDownIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No categories yet. Add your first category name above.
                      </p>
                    )}
                  </div>
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
      {categories.map((categoryData) => {
        const items = groupedItems[categoryData.name] || [];
        const category = categoryData.name;
        return (
        <Card key={category} className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            {/* Category Header - Clickable */}
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => toggleCategoryExpansion(category)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-mexican-green/10 rounded-lg">
                  {React.createElement(getCategoryIcon(categories.find(c => c.name === category)?.icon || 'utensils'), {
                    className: "h-5 w-5 text-mexican-green"
                  })}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    {categoryLabels[category] || category}
                    <span className="text-sm text-gray-500 font-normal">
                      ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </span>
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Edit All Items in Category */}
                <Button
                  size="sm"
                  variant={items.some(item => editMode[item.id]) ? "default" : "outline"}
                  className={`transition-all ${
                    items.some(item => editMode[item.id]) 
                      ? 'bg-mexican-green text-white hover:bg-mexican-green/90 border-mexican-green' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent category toggle
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
                    } else {
                      toast({
                        title: "Edit mode disabled",
                        description: `${category} items are no longer editable`,
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
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent category toggle
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
                
                {/* Category Expand/Collapse indicator */}
                <ChevronDown 
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    expandedCategories[category] !== false ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
            
            {/* Menu Items List - Collapsible */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedCategories[category] !== false 
                ? 'max-h-[2000px] opacity-100' 
                : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-2 pt-2">
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
                
                  <Card 
                    className="group relative cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => !editMode[item.id] && toggleItemExpansion(item.id)}
                  >
                    <CardContent className="p-4">
                      {/* Delete button in corner when edit mode is active */}
                      {editMode[item.id] && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border-red-200 w-8 h-8 p-0 rounded-full shadow-sm z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {/* Collapsed view - Always show title and price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {/* Editable Name - Collapsed */}
                          {inlineEditing[`${item.id}-name`] ? (
                            <Input
                              value={tempValues[`${item.id}-name`] || ''}
                              onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-name`]: e.target.value }))}
                              onKeyDown={(e) => handleKeyPress(e, item.id, 'name')}
                              onBlur={() => saveInlineEdit(item.id, 'name')}
                              className="font-semibold h-7 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h4 
                              className={`font-semibold px-1 py-0.5 rounded transition-all ${
                                editMode[item.id] 
                                  ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50' 
                                  : 'cursor-default'
                              }`}
                              onClick={(e) => {
                                if (editMode[item.id]) {
                                  e.stopPropagation();
                                  startInlineEdit(item.id, 'name', item.name);
                                }
                              }}
                            >
                              {item.name}
                            </h4>
                          )}
                          
                          {/* Editable Price - Collapsed */}
                          {inlineEditing[`${item.id}-price`] ? (
                            <Input
                              value={tempValues[`${item.id}-price`] || ''}
                              onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-price`]: e.target.value }))}
                              onKeyDown={(e) => handleKeyPress(e, item.id, 'price')}
                              onBlur={() => saveInlineEdit(item.id, 'price')}
                              className="h-7 text-sm w-20"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <Badge 
                              variant="outline" 
                              className={`transition-all ${editMode[item.id] ? 'cursor-pointer hover:bg-gray-100 border-dashed border-blue-300 bg-blue-50' : 'cursor-default'}`}
                              onClick={(e) => {
                                if (editMode[item.id]) {
                                  e.stopPropagation();
                                  startInlineEdit(item.id, 'price', item.price);
                                }
                              }}
                            >
                              ${parseFloat(item.price).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Expand/Collapse indicator */}
                        {!editMode[item.id] && (
                          <ChevronDown 
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                              expandedItems[item.id] ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>

                      {/* Expanded content - Show when expanded OR in edit mode */}
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedItems[item.id] || editMode[item.id] 
                          ? 'max-h-[500px] opacity-100 mt-4' 
                          : 'max-h-0 opacity-0'
                      }`}>
                        <div className="flex space-x-4">
                          {/* Food Image */}
                          <div className={`w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative group ${
                            editMode[item.id] ? 'cursor-pointer' : ''
                          }`}>
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
                            
                            {/* Hover overlay - only shown in edit mode */}
                            {editMode[item.id] && (
                              <>
                                {/* Image editing input */}
                                {inlineEditing[`${item.id}-image`] ? (
                                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-2">
                                    <Input
                                      value={tempValues[`${item.id}-image`] || ''}
                                      onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-image`]: e.target.value }))}
                                      onKeyDown={(e) => handleKeyPress(e, item.id, 'image')}
                                      onBlur={() => saveInlineEdit(item.id, 'image')}
                                      placeholder="Image URL..."
                                      className="text-xs h-6 bg-white"
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  /* Hover overlay */
                                  <div 
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                                    onClick={() => startInlineEdit(item.id, 'image', item.image)}
                                  >
                                    <div className="text-white text-center">
                                      <Camera className="h-4 w-4 mx-auto mb-1" />
                                      <span className="text-xs font-medium">Change Image</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Item Details - Only show in expanded view */}
                          <div className="flex-1">
                            {/* Editable Translation */}
                            {inlineEditing[`${item.id}-translation`] ? (
                              <Input
                                value={tempValues[`${item.id}-translation`] || ''}
                                onChange={(e) => setTempValues(prev => ({ ...prev, [`${item.id}-translation`]: e.target.value }))}
                                onKeyDown={(e) => handleKeyPress(e, item.id, 'translation')}
                                onBlur={() => saveInlineEdit(item.id, 'translation')}
                                className="text-sm h-7 mb-1"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <p 
                                className={`text-sm text-gray-600 mb-1 px-1 py-0.5 rounded min-h-[20px] transition-all ${
                                  editMode[item.id] 
                                    ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50' 
                                    : 'cursor-default'
                                }`}
                                onClick={(e) => {
                                  if (editMode[item.id]) {
                                    e.stopPropagation();
                                    startInlineEdit(item.id, 'translation', item.translation || '');
                                  }
                                }}
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
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <p 
                                className={`text-xs text-gray-500 mb-2 px-1 py-0.5 rounded min-h-[20px] transition-all ${
                                  editMode[item.id] 
                                    ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50' 
                                    : 'cursor-default'
                                }`}
                                onClick={(e) => {
                                  if (editMode[item.id]) {
                                    e.stopPropagation();
                                    startInlineEdit(item.id, 'description', item.description || '');
                                  }
                                }}
                              >
                                {item.description || 'Click to add description...'}
                              </p>
                            )}
                          </div>
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
          </CardContent>
        </Card>
        );
      })}

      {menuItems.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found. Add your first item!</p>
        </div>
      )}
    </div>
  );
}