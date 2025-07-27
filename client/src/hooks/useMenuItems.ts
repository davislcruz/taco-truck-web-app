import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, InsertMenuItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useMenuItems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Menu item state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [inlineEditing, setInlineEditing] = useState<{ [key: string]: boolean }>({});
  const [tempValues, setTempValues] = useState<{ [key: string]: any }>({});
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
  const [customOrder, setCustomOrder] = useState<Record<string, number[]>>({});
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({});
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [originalValues, setOriginalValues] = useState<{ [key: number]: MenuItem }>({});
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: Partial<MenuItem> }>({});

  // Queries
  const { data: menuItems = [], isLoading: menuItemsLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/menu");
      return res.json() as Promise<MenuItem[]>;
    },
  });

  // Mutations
  const createMenuItemMutation = useMutation({
    mutationFn: async (item: InsertMenuItem) => {
      const res = await apiRequest("POST", "/api/menu", item);
      return res.json() as Promise<MenuItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast({ title: "Menu item created successfully" });
      handleDialogClose();
    },
    onError: () => {
      toast({ title: "Failed to create menu item", variant: "destructive" });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, ...item }: Partial<MenuItem> & { id: number }) => {
      const res = await apiRequest("PUT", `/api/menu/${id}`, item);
      return res.json() as Promise<MenuItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast({ title: "Menu item updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update menu item", variant: "destructive" });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast({ title: "Menu item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete menu item", variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (categoryOrders: Record<string, number[]>) => {
      await apiRequest("PUT", "/api/menu/order", { categoryOrders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  // Computed values
  const groupedItems = useMemo(() => {
    const grouped = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Apply custom ordering if available
    Object.keys(grouped).forEach(category => {
      if (customOrder[category]) {
        const orderedItems: MenuItem[] = [];
        customOrder[category].forEach(id => {
          const item = grouped[category].find(item => item.id === id);
          if (item) orderedItems.push(item);
        });
        // Add any items not in custom order at the end
        grouped[category].forEach(item => {
          if (!customOrder[category].includes(item.id)) {
            orderedItems.push(item);
          }
        });
        grouped[category] = orderedItems;
      }
    });

    return grouped;
  }, [menuItems, customOrder]);

  // Actions
  const toggleExpanded = (itemId: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleEditMode = (itemId: number) => {
    setEditMode(prev => {
      const newEditMode = { ...prev, [itemId]: !prev[itemId] };
      
      if (newEditMode[itemId]) {
        // Entering edit mode - store original values
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
          setOriginalValues(prev => ({ ...prev, [itemId]: { ...item } }));
          setPendingChanges(prev => ({ ...prev, [itemId]: {} }));
        }
      } else {
        // Exiting edit mode - clean up
        setOriginalValues(prev => {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        });
        setPendingChanges(prev => {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        });
      }
      
      return newEditMode;
    });
  };

  const updatePendingChange = (itemId: number, field: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const saveChanges = (itemId: number) => {
    const changes = pendingChanges[itemId];
    if (changes && Object.keys(changes).length > 0) {
      updateMenuItemMutation.mutate({ id: itemId, ...changes });
    }
    toggleEditMode(itemId);
  };

  const cancelChanges = (itemId: number) => {
    toggleEditMode(itemId);
  };

  const startInlineEditing = (key: string, currentValue: any) => {
    setInlineEditing(prev => ({ ...prev, [key]: true }));
    setTempValues(prev => ({ ...prev, [key]: currentValue }));
  };

  const stopInlineEditing = (key: string, save: boolean = false) => {
    if (save && tempValues[key] !== undefined) {
      const [itemId, field] = key.split('-');
      updatePendingChange(parseInt(itemId), field, tempValues[key]);
    }
    
    setInlineEditing(prev => ({ ...prev, [key]: false }));
    setTempValues(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleEdit = (item: MenuItem) => {
    // Toggle edit mode for inline editing
    toggleEditMode(item.id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const createMenuItem = (item: InsertMenuItem) => {
    createMenuItemMutation.mutate(item);
  };

  const updateMenuItem = (id: number, item: Partial<MenuItem>) => {
    updateMenuItemMutation.mutate({ id, ...item });
  };

  const deleteMenuItem = (id: number) => {
    deleteMenuItemMutation.mutate(id);
  };

  const updateMenuOrder = (categoryOrders: Record<string, number[]>) => {
    updateOrderMutation.mutate(categoryOrders);
  };

  return {
    // State
    menuItems,
    menuItemsLoading,
    groupedItems,
    isDialogOpen,
    setIsDialogOpen,
    editingItem,
    setEditingItem,
    inlineEditing,
    tempValues,
    setTempValues,
    editMode,
    customOrder,
    setCustomOrder,
    expandedItems,
    expandedCategories,
    originalValues,
    pendingChanges,
    
    // Actions
    toggleExpanded,
    toggleCategoryExpanded,
    toggleEditMode,
    updatePendingChange,
    saveChanges,
    cancelChanges,
    startInlineEditing,
    stopInlineEditing,
    handleEdit,
    handleDialogClose,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateMenuOrder,
    
    // Mutation states
    isCreating: createMenuItemMutation.isPending,
    isUpdating: updateMenuItemMutation.isPending,
    isDeleting: deleteMenuItemMutation.isPending,
    isUpdatingOrder: updateOrderMutation.isPending,
  };
}