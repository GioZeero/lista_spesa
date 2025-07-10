"use client";

import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddItemSheet } from "@/components/add-item-sheet";
import { ShoppingListItemCard } from "@/components/shopping-list-item";
import type { ShoppingItem } from "@/types";

const initialItems: ShoppingItem[] = [
  {
    id: '1',
    name: 'Organic Apples',
    quantity: 1,
    unit: 'kg',
    prices: { famila: 2.99, lidl: 2.49, primoprezzo: 3.20 },
  },
  {
    id: '2',
    name: 'Whole Milk',
    quantity: 2,
    unit: 'L',
    prices: { famila: 1.15, lidl: 0.99, primoprezzo: 1.25 },
  },
  {
    id: '3',
    name: 'Sourdough Bread',
    quantity: 1,
    unit: 'loaf',
    prices: { famila: 3.50, primoprezzo: 3.80 },
  },
  {
    id: '4',
    name: 'Free-range Eggs',
    quantity: 12,
    unit: 'pieces',
    prices: { lidl: 2.80 },
  },
];

export default function Home() {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddItem = (item: Omit<ShoppingItem, 'id' | 'prices'>) => {
    setItems((prevItems) => [
      ...prevItems,
      { ...item, id: Date.now().toString(), prices: {} },
    ]);
    setIsSheetOpen(false);
  };

  const handleUpdateItem = (updatedItem: ShoppingItem) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const totalCost = items.reduce((total, item) => {
    const prices = Object.values(item.prices).filter(p => typeof p === 'number' && p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    return total + (minPrice * item.quantity);
  }, 0).toFixed(2);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight font-headline text-gray-800">
              ShopSmart
            </h1>
          </div>
          <AddItemSheet
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            onAddItem={handleAddItem}
          >
            <Button onClick={() => setIsSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </AddItemSheet>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:p-6">
          <h2 className="text-xl font-semibold text-card-foreground">My Shopping List</h2>
          <div className="text-lg font-bold text-accent">
            Estimated Total: ${totalCost}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ShoppingListItemCard
                key={item.id}
                item={item}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-4 text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16" />
            <h3 className="text-xl font-semibold">Your list is empty</h3>
            <p>Click "Add Item" to start building your shopping list.</p>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ShopSmart. All rights reserved.
      </footer>
    </div>
  );
}
