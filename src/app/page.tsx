"use client";

import { useState, useEffect } from "react";
import { Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddItemSheet } from "@/components/add-item-sheet";
import { ShoppingListItemCard } from "@/components/shopping-list-item";
import type { ShoppingItem } from "@/types";
import { ModeToggle } from "@/components/mode-toggle";

const initialItems: ShoppingItem[] = [
  {
    id: '1',
    name: 'Mele Biologiche',
    quantity: 1,
    unit: 'kg',
    prices: { famila: 2.99, lidl: 2.49, primoprezzo: 3.20 },
    selectedStore: 'lidl',
  },
  {
    id: '2',
    name: 'Latte Intero',
    quantity: 2,
    unit: 'L',
    prices: { famila: 1.15, lidl: 0.99, primoprezzo: 1.25 },
    selectedStore: null,
  },
  {
    id: '3',
    name: 'Pane a Lievitazione Naturale',
    quantity: 1,
    unit: 'filone',
    prices: { famila: 3.50, primoprezzo: 3.80 },
    selectedStore: 'famila'
  },
  {
    id: '4',
    name: 'Uova da Allevamento a Terra',
    quantity: 12,
    unit: 'pezzi',
    prices: { lidl: 2.80 },
    selectedStore: null,
  },
];

export default function Home() {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleAddItem = (item: Omit<ShoppingItem, 'id' | 'prices'>) => {
    setItems((prevItems) => [
      ...prevItems,
      { ...item, id: Date.now().toString(), prices: {}, selectedStore: null },
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
    let price = 0;
    if (item.selectedStore && item.prices[item.selectedStore]) {
      price = item.prices[item.selectedStore]!;
    } else {
      const availablePrices = Object.values(item.prices).filter(p => typeof p === 'number' && p > 0);
      price = availablePrices.length > 0 ? Math.min(...availablePrices) : 0;
    }
    return total + (price * item.quantity);
  }, 0).toFixed(2);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight font-headline">
              SpesaIntelligente
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <AddItemSheet
              open={isSheetOpen}
              onOpenChange={setIsSheetOpen}
              onAddItem={handleAddItem}
            >
              <Button onClick={() => setIsSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Articolo
              </Button>
            </AddItemSheet>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:p-6">
          <h2 className="text-xl font-semibold text-card-foreground">La Mia Lista della Spesa</h2>
          <div className="text-lg font-bold text-foreground">
            Totale Stimato: €{totalCost}
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
            <h3 className="text-xl font-semibold">La tua lista è vuota</h3>
            <p>Clicca "Aggiungi Articolo" per iniziare a compilare la tua lista della spesa.</p>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        {currentYear !== null && `© ${currentYear} SpesaIntelligente. Tutti i diritti riservati.`}
      </footer>
    </div>
  );
}
