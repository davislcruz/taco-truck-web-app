import { useState, useMemo, useEffect } from "react";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define ingredient interface
interface Ingredient {
  id: string;
  name: string;
  isDefault: boolean;
  price: number;
}

const categoryFormSchema = z.object({
  translation: z.string().min(1, "Display name is required"),
  icon: z.string().min(1, "Icon is required"),
  order: z.number().min(0),
  ingredients: z.array(z.object({
    id: z.string(),
    name: z.string(),
    isDefault: z.boolean(),
    price: z.number()
  })).default([]),
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
  // Tab state for category modal
  const [activeTab, setActiveTab] = useState<'ingredients' | 'sort'>('ingredients');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [inlineEditing, setInlineEditing] = useState<{ [key: string]: boolean }>({});
  const [tempValues, setTempValues] = useState<{ [key: string]: any }>({});
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
  const [customOrder, setCustomOrder] = useState<Record<string, number[]>>({});
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({});
  // Initialize all categories as expanded by default
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [originalValues, setOriginalValues] = useState<{ [key: number]: MenuItem }>({});
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: Partial<MenuItem> }>({});
  const [categoryOrderList, setCategoryOrderList] = useState<Array<{ id: string, name: string, icon: string, isNew?: boolean }>>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [justCreatedCategory, setJustCreatedCategory] = useState<string | null>(null);
  const [categoryIngredients, setCategoryIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientPrice, setNewIngredientPrice] = useState("0.00");
  const [newIngredientIsDefault, setNewIngredientIsDefault] = useState(false);

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

  // Save all pending changes for items in a category
  const saveCategoryChanges = (categoryItems: MenuItem[]) => {
    categoryItems.forEach(item => {
      const changes = pendingChanges[item.id];
      if (changes) {
        const updateData: InsertMenuItem = {
          name: changes.name || item.name,
          translation: changes.translation || item.translation,
          category: changes.category || item.category,
          price: changes.price || item.price,
          description: changes.description || item.description,
          image: changes.image || item.image,
          meats: changes.meats || item.meats,
          toppings: changes.toppings || item.toppings,
          sizes: changes.sizes || item.sizes,
        };
        updateMutation.mutate({ id: item.id, data: updateData });
      }
    });

    // Clear pending changes for these items
    setPendingChanges(prev => {
      const newPending = { ...prev };
      categoryItems.forEach(item => {
        delete newPending[item.id];
      });
      return newPending;
    });

    // Clear original values for these items
    setOriginalValues(prev => {
      const newOriginal = { ...prev };
      categoryItems.forEach(item => {
        delete newOriginal[item.id];
      });
      return newOriginal;
    });
  };

  // Cancel changes and revert to original values
  const cancelCategoryChanges = (categoryItems: MenuItem[]) => {
    categoryItems.forEach(item => {
      const original = originalValues[item.id];
      if (original) {
        // Revert any inline editing
        setInlineEditing(prev => {
          const newInline = { ...prev };
          Object.keys(newInline).forEach(key => {
            if (key.startsWith(`${item.id}-`)) {
              delete newInline[key];
            }
          });
          return newInline;
        });

        // Clear temp values
        setTempValues(prev => {
          const newTemp = { ...prev };
          Object.keys(newTemp).forEach(key => {
            if (key.startsWith(`${item.id}-`)) {
              delete newTemp[key];
            }
          });
          return newTemp;
        });
      }
    });

    // Clear pending changes
    setPendingChanges(prev => {
      const newPending = { ...prev };
      categoryItems.forEach(item => {
        delete newPending[item.id];
      });
      return newPending;
    });

    // Clear original values
    setOriginalValues(prev => {
      const newOriginal = { ...prev };
      categoryItems.forEach(item => {
        delete newOriginal[item.id];
      });
      return newOriginal;
    });
  };

  // Helper function to get current value (pending changes or original)
  const getCurrentValue = (item: MenuItem, field: keyof MenuItem) => {
    const pendingChange = pendingChanges[item.id];
    if (pendingChange && pendingChange[field] !== undefined) {
      return pendingChange[field];
    }
    return item[field];
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
      ingredients: [],
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
      order: data.order,
      ingredients: categoryIngredients
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
    // Ensure existingIngredients is always an array
    const existingIngredients = Array.isArray(category.ingredients) ? category.ingredients : [];
    setCategoryIngredients(existingIngredients);
    categoryForm.reset({
      translation: category.translation,
      icon: category.icon,
      order: category.order,
      ingredients: existingIngredients,
    });
    setIsCategoryDialogOpen(true);
  };

  // Ingredient management functions
  const addIngredient = () => {
    if (newIngredientName.trim()) {
      const newIngredient: Ingredient = {
        id: Date.now().toString(),
        name: newIngredientName.trim(),
        isDefault: newIngredientIsDefault,
        price: parseFloat(newIngredientPrice) || 0
      };

      const updatedIngredients = [...categoryIngredients, newIngredient];
      setCategoryIngredients(updatedIngredients);
      categoryForm.setValue("ingredients", updatedIngredients);

      // Reset form
      setNewIngredientName("");
      setNewIngredientPrice("0.00");
      setNewIngredientIsDefault(false);
    }
  };

  const removeIngredient = (ingredientId: string) => {
    const updatedIngredients = categoryIngredients.filter(ing => ing.id !== ingredientId);
    setCategoryIngredients(updatedIngredients);
    categoryForm.setValue("ingredients", updatedIngredients);
  };

  const updateIngredient = (ingredientId: string, field: keyof Ingredient, value: any) => {
    const updatedIngredients = categoryIngredients.map(ing =>
      ing.id === ingredientId ? { ...ing, [field]: value } : ing
    );
    setCategoryIngredients(updatedIngredients);
    categoryForm.setValue("ingredients", updatedIngredients);
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
    setCategoryIngredients([]);
    setNewIngredientName("");
    setNewIngredientPrice("0.00");
    setNewIngredientIsDefault(false);
    // Reset the category order list to remove any "new" items
    setCategoryOrderList(prev => prev.filter(cat => !cat.isNew));
  };

  // Inline editing functions
  const startInlineEdit = (itemId: number, field: string, currentValue: any) => {
    if (!editMode[itemId]) return; // Only allow editing if edit mode is enabled for this item

    // Store original value if not already stored
    if (!originalValues[itemId]) {
      const item = menuItems.find(item => item.id === itemId);
      if (item) {
        setOriginalValues(prev => ({ ...prev, [itemId]: item }));
      }
    }

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
      // Store the change in pending changes instead of immediately saving
      setPendingChanges(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: newValue
        }
      }));
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
      <div className="flex justify-end mb-4">
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 shadow-lg"
              onClick={() => setIsCategoryDialogOpen(true)}
            >
              + Create Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new menu category, set its icon, order, and ingredients.
              </DialogDescription>
            </DialogHeader>
            {/* Category creation form */}
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <div className="flex flex-1 gap-4">
                <div className="flex-1 flex flex-col">
                  <Label className="mb-1">Category Name</Label>
                  <Input {...categoryForm.register("translation")} placeholder="Category name..." className="h-8 px-2 text-sm border rounded-md" />
                </div>
                <div className="flex flex-col w-32">
                  <Label className="mb-1">Type</Label>
                  <Select value={categoryForm.watch("icon")} onValueChange={val => categoryForm.setValue("icon", val)}>
                    <SelectTrigger
                      className="h-8 px-2 text-sm border rounded-md flex items-center w-full focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:border-black data-[state=open]:ring-2 data-[state=open]:ring-black data-[state=open]:ring-offset-2 data-[state=open]:border-black"
                    >
                      <SelectValue placeholder="Select icon" />
                      {/* Add focus ring styling */}
                      <style jsx>{`
                        .type-select:focus {
                          outline: 2px solid #000;
                          outline-offset: 2px;
                        }
                      `}</style>
                    </SelectTrigger>
                    <SelectContent className="w-32">
                      <SelectItem value="utensils">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-green-700" />
                          <span className="text-sm">Food</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="glassWater">
                        <div className="flex items-center gap-2">
                          <GlassWater className="h-5 w-5 text-green-700" />
                          <span className="text-sm">Drink</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Order</Label>
                <div className="bg-gray-50 rounded-md border p-2 mt-1">
                  {categoryOrderList.map((cat, idx) => (
                    <div key={cat.id} className={cat.isNew ? "flex items-center justify-between py-1 bg-blue-50 border border-blue-300 border-dotted rounded" : "flex items-center justify-between py-1"}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs text-gray-500 font-bold">{idx + 1}</span>
                        {/* Show icon for each category, always show drink icon for 'bebidas' */}
                        {cat.name.toLowerCase() === "bebidas" ? (
                          <GlassWater className="h-4 w-4 text-green-700" />
                        ) : cat.icon === "utensils" ? (
                          <Utensils className="h-4 w-4 text-green-700" />
                        ) : cat.icon === "glassWater" ? (
                          <GlassWater className="h-4 w-4 text-green-700" />
                        ) : null}
                        <span className={cat.isNew ? "font-bold text-blue-700 flex items-center gap-1" : ""}>
                          {cat.name}
                          {cat.isNew && (
                            <span className="ml-1 text-xs bg-blue-600 text-white rounded px-1 py-0.5 font-semibold">NEW</span>
                          )}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" className="p-1" disabled={idx === 0} onClick={() => moveCategoryUp(idx)}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="p-1" disabled={idx === categoryOrderList.length - 1} onClick={() => moveCategoryDown(idx)}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Close flex row div */}
              {/* Ingredient management UI can be added here if needed */}
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={handleCategoryDialogClose}>Cancel</Button>
                <Button type="submit" variant="default" className="bg-green-600 text-white">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
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
                  {!items.some(item => editMode[item.id]) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent category toggle
                        const categoryItems = items.map(item => item.id);
                        const newEditMode = { ...editMode };

                        categoryItems.forEach(id => {
                          newEditMode[id] = true;
                        });

                        setEditMode(newEditMode);

                        toast({
                          title: "Edit mode enabled",
                          description: `All ${category} items can now be edited`,
                          duration: 2000,
                        });
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  ) : (
                    <>
                      {/* Save Changes Button */}
                      <Button
                        size="sm"
                        variant="default"
                        className="w-8 h-8 p-0 bg-mexican-green text-white hover:bg-mexican-green/90 border-mexican-green"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent category toggle
                          saveCategoryChanges(items);

                          // Exit edit mode for all items in category
                          const categoryItems = items.map(item => item.id);
                          const newEditMode = { ...editMode };
                          categoryItems.forEach(id => {
                            newEditMode[id] = false;
                          });
                          setEditMode(newEditMode);

                          toast({
                            title: "Changes saved",
                            description: `All ${category} items have been saved`,
                            duration: 2000,
                          });
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      {/* Cancel Changes Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent category toggle
                          cancelCategoryChanges(items);

                          // Exit edit mode for all items in category
                          const categoryItems = items.map(item => item.id);
                          const newEditMode = { ...editMode };
                          categoryItems.forEach(id => {
                            newEditMode[id] = false;
                          });
                          setEditMode(newEditMode);

                          toast({
                            title: "Changes cancelled",
                            description: `All ${category} edits have been discarded`,
                            duration: 2000,
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}

                  {/* Delete Category - Only show in edit mode */}
                  {items.some(i => editMode[i.id]) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent category toggle
                        const categoryData = categories.find(cat => cat.name === category);
                        if (categoryData) {
                          if (items.length > 0) {
                            if (confirm(`Are you sure you want to delete the "${categoryData.translation}" category? This will also delete all ${items.length} items in this category. This action cannot be undone.`)) {
                              handleDeleteCategory(categoryData.id);
                            }
                          } else {
                            if (confirm(`Are you sure you want to delete the "${categoryData.translation}" category?`)) {
                              handleDeleteCategory(categoryData.id);
                            }
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Category Expand/Collapse indicator */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCategories(prev => ({
                        ...prev,
                        [category]: prev[category] === false ? true : false
                      }));
                    }}
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${expandedCategories[category] !== false ? 'rotate-180' : ''
                        }`}
                    />
                  </Button>
                </div>
              </div>

              {/* Menu Items List - Collapsible */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedCategories[category] !== false
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
                                  className={`font-semibold px-1 py-0.5 rounded transition-all ${editMode[item.id]
                                      ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50'
                                      : 'cursor-default'
                                    }`}
                                  onClick={(e) => {
                                    if (editMode[item.id]) {
                                      e.stopPropagation();
                                      startInlineEdit(item.id, 'name', getCurrentValue(item, 'name'));
                                    }
                                  }}
                                >
                                  {getCurrentValue(item, 'name')}
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
                                      startInlineEdit(item.id, 'price', getCurrentValue(item, 'price'));
                                    }
                                  }}
                                >
                                  ${parseFloat(getCurrentValue(item, 'price') as string).toFixed(2)}
                                </Badge>
                              )}
                            </div>

                            {/* Expand/Collapse indicator */}
                            {!editMode[item.id] && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItemExpansion(item.id);
                                }}
                              >
                                <ChevronDown
                                  className={`h-3 w-3 transition-transform duration-200 ${expandedItems[item.id] ? 'rotate-180' : ''
                                    }`}
                                />
                              </Button>
                            )}
                          </div>

                          {/* Expanded content - Show when expanded OR in edit mode */}
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedItems[item.id] || editMode[item.id]
                              ? 'max-h-[500px] opacity-100 mt-4'
                              : 'max-h-0 opacity-0'
                            }`}>
                            <div className="flex space-x-4">
                              {/* Food Image */}
                              <div className={`w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative group ${editMode[item.id] ? 'cursor-pointer' : ''
                                }`}>
                                {getCurrentValue(item, 'image') ? (
                                  <img
                                    src={getCurrentValue(item, 'image') as string}
                                    alt={getCurrentValue(item, 'name') as string}
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
                                        onClick={() => startInlineEdit(item.id, 'image', getCurrentValue(item, 'image'))}
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
                                    className={`text-sm text-gray-600 mb-1 px-1 py-0.5 rounded min-h-[20px] transition-all ${editMode[item.id]
                                        ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50'
                                        : 'cursor-default'
                                      }`}
                                    onClick={(e) => {
                                      if (editMode[item.id]) {
                                        e.stopPropagation();
                                        startInlineEdit(item.id, 'translation', getCurrentValue(item, 'translation') || '');
                                      }
                                    }}
                                  >
                                    {getCurrentValue(item, 'translation') || 'Click to add translation...'}
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
                                    className={`text-xs text-gray-500 mb-2 px-1 py-0.5 rounded min-h-[20px] transition-all ${editMode[item.id]
                                        ? 'cursor-pointer hover:bg-gray-100 border border-dashed border-blue-300 bg-blue-50'
                                        : 'cursor-default'
                                      }`}
                                    onClick={(e) => {
                                      if (editMode[item.id]) {
                                        e.stopPropagation();
                                        startInlineEdit(item.id, 'description', getCurrentValue(item, 'description') || '');
                                      }
                                    }}
                                  >
                                    {getCurrentValue(item, 'description') || 'Click to add description...'}
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