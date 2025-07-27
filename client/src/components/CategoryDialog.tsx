import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, Utensils, GlassWater, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  // Temporary state - will be replaced with useCategories hook later
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryFormTab, setCategoryFormTab] = useState<'order' | 'ingredients'>('order');
  const [categoryOrderList, setCategoryOrderList] = useState<Array<{ id: string, name: string, icon: string, isNew?: boolean }>>([]);
  const [categoryIngredients, setCategoryIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientPrice, setNewIngredientPrice] = useState("0.00");
  const [newIngredientIsDefault, setNewIngredientIsDefault] = useState(false);

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
    // TODO: Implement category creation
    console.log("Creating category:", {
      ...data,
      name: data.translation.toLowerCase().replace(/\s+/g, "_"),
      ingredients: categoryIngredients,
    });
    handleCategoryDialogClose();
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
            <Button type="submit" variant="default" className="bg-green-600 text-white">
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Sub-components for better organization
function CategoryOrderTab({ categoryOrderList, moveCategoryUp, moveCategoryDown }: any) {
  return (
    <div>
      <Label>Order</Label>
      <div className="bg-gray-50 rounded-md border p-2 mt-1">
        {categoryOrderList.map((cat: any, idx: number) => (
          <div key={cat.id} className={cat.isNew ? "flex items-center justify-between py-1 bg-blue-50 border border-blue-300 border-dotted rounded" : "flex items-center justify-between py-1"}>
            <div className="flex items-center gap-2">
              <span className="w-5 text-center text-xs text-gray-500 font-bold">{idx + 1}</span>
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