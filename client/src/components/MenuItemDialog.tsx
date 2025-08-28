import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  translation: z.string().min(1, "Translation is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  meats: z.string().optional(),
  ingredients: z.string().optional(),
  sizes: z.string().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemFormSchema>;

interface MenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isCreating: boolean;
  defaultCategory?: string;
}

export function MenuItemDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isCreating,
  defaultCategory 
}: MenuItemDialogProps) {
  // Get categories for the select dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return res.json() as Promise<Category[]>;
    },
  });

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      translation: "",
      category: defaultCategory || "",
      price: "",
      description: "",
      image: "",
      meats: "",
      ingredients: "",
      sizes: "",
    },
  });

  // Update category when defaultCategory changes
  useEffect(() => {
    if (defaultCategory) {
      form.setValue("category", defaultCategory);
    }
  }, [defaultCategory, form]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        translation: "",
        category: defaultCategory || "",
        price: "",
        description: "",
        image: "",
        meats: "",
        ingredients: "",
        sizes: "",
      });
    }
  }, [isOpen, form, defaultCategory]);

  const handleSubmit = (data: MenuItemFormData) => {
    // Convert strings to arrays for array fields
    const processedData = {
      ...data,
      price: parseFloat(data.price),
      meats: data.meats ? data.meats.split(",").map(s => s.trim()).filter(Boolean) : [],
      ingredients: data.ingredients ? data.ingredients.split(",").map(s => s.trim()).filter(Boolean) : [],
      sizes: data.sizes ? data.sizes.split(",").map(s => s.trim()).filter(Boolean) : [],
    };

    onSubmit(processedData);
  };

  return isOpen ? (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Menu Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name (English)</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Tacos de Carne Asada"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-error mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="translation">Translation (Spanish)</Label>
              <Input
                id="translation"
                {...form.register("translation")}
                placeholder="Tacos de Carne Asada"
              />
              {form.formState.errors.translation && (
                <p className="text-sm text-error mt-1">{form.formState.errors.translation.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                {...form.register("category")} 
                value={form.watch("category")}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.translation}
                  </option>
                ))}
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-error mt-1">{form.formState.errors.category.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...form.register("price")}
                placeholder="12.99"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-error mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Delicious grilled beef tacos with onions and cilantro"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              {...form.register("image")}
              placeholder="https://example.com/taco-image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="meats">Meats</Label>
              <Input
                id="meats"
                {...form.register("meats")}
                placeholder="carne asada, pollo, carnitas"
              />
              <p className="text-xs text-base-content/60 mt-1">Comma-separated list</p>
            </div>
            
            <div>
              <Label htmlFor="ingredients">Ingredients</Label>
              <Input
                id="ingredients"
                {...form.register("ingredients")}
                placeholder="onions, cilantro, salsa"
              />
              <p className="text-xs text-base-content/60 mt-1">Comma-separated list</p>
            </div>
            
            <div>
              <Label htmlFor="sizes">Sizes</Label>
              <Input
                id="sizes"
                {...form.register("sizes")}
                placeholder="small, medium, large"
              />
              <p className="text-xs text-base-content/60 mt-1">Comma-separated list</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="btn btn-success"
            >
              {isCreating ? "Creating..." : "Create Menu Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;
}