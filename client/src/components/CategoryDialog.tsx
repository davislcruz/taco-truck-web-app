import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, Utensils, GlassWater, Trash2, GripVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCategories } from "@/hooks/useCategories";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export function CategoryDialog() {
  const categoriesHook = useCategories();
  const {
    categories,
    categoriesLoading,
    isCategoryDialogOpen,
    setIsCategoryDialogOpen,
    categoryFormTab,
    setCategoryFormTab,
    categoryOrderList,
    setCategoryOrderList,
    categoryIngredients,
    setCategoryIngredients,
    newIngredientName,
    setNewIngredientName,
    newIngredientPrice,
    setNewIngredientPrice,
    newIngredientIsDefault,
    setNewIngredientIsDefault,
    moveCategoryUp,
    moveCategoryDown,
    addIngredient,
    removeIngredient,
    handleCategoryDialogClose,
    createCategory,
    isCreatingCategory,
  } = categoriesHook;

  // Load existing categories into the order list when dialog opens
  useEffect(() => {
    if (isCategoryDialogOpen && categories.length > 0) {
      const sortedCategories = [...categories]
        .sort((a, b) => a.order - b.order)
        .map(cat => ({
          id: cat.id.toString(),
          name: cat.translation,
          icon: cat.icon,
        }));
      setCategoryOrderList(sortedCategories);
    }
  }, [isCategoryDialogOpen, categories, setCategoryOrderList]);

  // Drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategoryOrderList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      translation: "",
      icon: "",
      order: 0,
      ingredients: [],
    },
  });

  const onCategorySubmit = (data: CategoryFormData) => {
    createCategory({
      ...data,
      name: data.translation.toLowerCase().replace(/\s+/g, "_"),
      ingredients: categoryIngredients,
    });
  };

  return (
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
        
        <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
          <div className="flex flex-1 gap-4">
            <div className="flex-1 flex flex-col">
              <Label className="mb-1">Category Name</Label>
              <Input {...categoryForm.register("translation")} placeholder="Category name..." className="h-8 px-2 text-sm border rounded-md" />
            </div>
            <div className="flex flex-col w-32">
              <Label className="mb-1">Type</Label>
              <Select value={categoryForm.watch("icon")} onValueChange={val => categoryForm.setValue("icon", val)}>
                <SelectTrigger className="h-8 px-2 text-sm border rounded-md flex items-center w-full focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:border-black data-[state=open]:ring-2 data-[state=open]:ring-black data-[state=open]:ring-offset-2 data-[state=open]:border-black">
                  <SelectValue placeholder="Select icon" />
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
          
          <Tabs value={categoryFormTab} onValueChange={(value) => setCategoryFormTab(value as 'order' | 'ingredients')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="order">Order & Settings</TabsTrigger>
              <TabsTrigger value="ingredients">Default Ingredients</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {categoryFormTab === 'order' && (
            <CategoryOrderTab 
              categoryOrderList={categoryOrderList}
              moveCategoryUp={moveCategoryUp}
              moveCategoryDown={moveCategoryDown}
              handleDragEnd={handleDragEnd}
              sensors={sensors}
            />
          )}
          
          {categoryFormTab === 'ingredients' && (
            <CategoryIngredientsTab 
              categoryIngredients={categoryIngredients}
              newIngredientName={newIngredientName}
              setNewIngredientName={setNewIngredientName}
              newIngredientPrice={newIngredientPrice}
              setNewIngredientPrice={setNewIngredientPrice}
              newIngredientIsDefault={newIngredientIsDefault}
              setNewIngredientIsDefault={setNewIngredientIsDefault}
              addIngredient={addIngredient}
              removeIngredient={removeIngredient}
            />
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={handleCategoryDialogClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="default" 
              className="bg-green-600 text-white"
              disabled={isCreatingCategory}
            >
              {isCreatingCategory ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Sub-components for better organization
function CategoryOrderTab({ categoryOrderList, moveCategoryUp, moveCategoryDown, handleDragEnd, sensors }: any) {
  return (
    <div>
      <Label>Category Order</Label>
      <p className="text-sm text-gray-600 mb-2">
        Drag and drop or use arrows to reorder categories. This affects the display order on the menu.
      </p>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-gray-50 rounded-md border p-3 mt-1">
          <SortableContext 
            items={categoryOrderList.map((cat: any) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categoryOrderList.map((cat: any, idx: number) => (
                <SortableRow 
                  key={cat.id}
                  cat={cat}
                  idx={idx}
                  moveCategoryUp={() => moveCategoryUp(idx)}
                  moveCategoryDown={() => moveCategoryDown(idx)}
                  isFirst={idx === 0}
                  isLast={idx === categoryOrderList.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}

function SortableRow({ cat, idx, moveCategoryUp, moveCategoryDown, isFirst, isLast }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white rounded-md border transition-all ${
        isDragging ? "shadow-lg z-10" : "hover:bg-gray-50"
      } ${cat.isNew ? "border-blue-300 border-2 border-dashed bg-blue-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <span className="w-8 text-center text-sm text-gray-500 font-semibold bg-gray-100 rounded px-2 py-1">
          {idx + 1}
        </span>
        <div className="flex items-center gap-2">
          {cat.icon === "utensils" ? (
            <Utensils className="h-5 w-5 text-green-700" />
          ) : cat.icon === "glassWater" ? (
            <GlassWater className="h-5 w-5 text-green-700" />
          ) : null}
          <span className={`font-medium ${cat.isNew ? "text-blue-700" : "text-gray-900"}`}>
            {cat.name}
            {cat.isNew && (
              <span className="ml-2 text-xs bg-blue-600 text-white rounded px-2 py-1 font-semibold">NEW</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          className="p-1 h-8 w-8" 
          disabled={isFirst} 
          onClick={moveCategoryUp}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          className="p-1 h-8 w-8" 
          disabled={isLast} 
          onClick={moveCategoryDown}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoryIngredientsTab({ 
  categoryIngredients, 
  newIngredientName, 
  setNewIngredientName,
  newIngredientPrice,
  setNewIngredientPrice,
  newIngredientIsDefault,
  setNewIngredientIsDefault,
  addIngredient,
  removeIngredient 
}: any) {
  return (
    <div className="bg-gray-50 rounded-md border p-4 mt-1">
      <Label>Default Ingredients & Extras</Label>
      <form
        className="flex flex-col gap-2 mt-2"
        onSubmit={e => {
          e.preventDefault();
          addIngredient();
        }}
      >
        <div className="flex gap-2 items-center">
          <Input
            type="text"
            placeholder="Ingredient name"
            value={newIngredientName}
            onChange={e => setNewIngredientName(e.target.value)}
            className="w-40"
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            value={newIngredientPrice}
            onChange={e => setNewIngredientPrice(e.target.value)}
            className="w-24"
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={newIngredientIsDefault}
              onChange={e => setNewIngredientIsDefault(e.target.checked)}
            />
            Default
          </label>
          <Button type="submit" size="sm" className="bg-blue-600 text-white">Add</Button>
        </div>
      </form>
      
      <div className="mt-4">
        {categoryIngredients.length === 0 ? (
          <div className="text-gray-400 text-sm">No ingredients added yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th>Name</th>
                <th>Price</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categoryIngredients.map((ing: any) => (
                <tr key={ing.id} className="border-b last:border-b-0">
                  <td>{ing.name}</td>
                  <td>${ing.price.toFixed(2)}</td>
                  <td>{ing.isDefault ? "Default" : "Extra"}</td>
                  <td>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="p-1"
                      onClick={() => removeIngredient(ing.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}