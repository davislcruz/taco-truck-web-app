import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category, InsertCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  isDefault: boolean;
  price: number;
}

export function useCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Category state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormTab, setCategoryFormTab] = useState<'order' | 'ingredients'>('order');
  const [categoryOrderList, setCategoryOrderList] = useState<Array<{ id: string, name: string, icon: string, isNew?: boolean }>>([]);
  const [justCreatedCategory, setJustCreatedCategory] = useState<string | null>(null);
  const [categoryIngredients, setCategoryIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientPrice, setNewIngredientPrice] = useState("0.00");
  const [newIngredientIsDefault, setNewIngredientIsDefault] = useState(false);

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return res.json() as Promise<Category[]>;
    },
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (category: InsertCategory) => {
      const res = await apiRequest("POST", "/api/categories", category);
      return res.json() as Promise<Category>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category created successfully" });
      handleCategoryDialogClose();
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  // Actions
  const moveCategoryUp = (index: number) => {
    if (index === 0) return;
    setCategoryOrderList(prev => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList;
    });
  };

  const moveCategoryDown = (index: number) => {
    if (index === categoryOrderList.length - 1) return;
    setCategoryOrderList(prev => {
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList;
    });
  };

  const addIngredient = () => {
    if (!newIngredientName.trim()) return;
    setCategoryIngredients(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: newIngredientName,
        price: parseFloat(newIngredientPrice),
        isDefault: newIngredientIsDefault,
      },
    ]);
    setNewIngredientName("");
    setNewIngredientPrice("0.00");
    setNewIngredientIsDefault(false);
  };

  const removeIngredient = (id: string) => {
    setCategoryIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleCategoryDialogClose = () => {
    setIsCategoryDialogOpen(false);
    setCategoryFormTab('order');
    setCategoryIngredients([]);
    setNewIngredientName("");
    setNewIngredientPrice("0.00");
    setNewIngredientIsDefault(false);
  };

  return {
    // State
    categories,
    categoriesLoading,
    isCategoryDialogOpen,
    setIsCategoryDialogOpen,
    editingCategory,
    setEditingCategory,
    categoryFormTab,
    setCategoryFormTab,
    categoryOrderList,
    setCategoryOrderList,
    justCreatedCategory,
    setJustCreatedCategory,
    categoryIngredients,
    setCategoryIngredients,
    newIngredientName,
    setNewIngredientName,
    newIngredientPrice,
    setNewIngredientPrice,
    newIngredientIsDefault,
    setNewIngredientIsDefault,
    
    // Actions
    moveCategoryUp,
    moveCategoryDown,
    addIngredient,
    removeIngredient,
    handleCategoryDialogClose,
    
    // Mutations
    createCategory: createCategoryMutation.mutate,
    isCreatingCategory: createCategoryMutation.isPending,
  };
}