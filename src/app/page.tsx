"use client";

import { useState, useEffect } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import type { ShoppingItem } from "@/types";
import { AddItemSheet } from "@/components/add-item-sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { ShoppingListItemCard } from "@/components/shopping-list-item";
import { Button } from "@/components/ui/button";

const initialItems: ShoppingItem[] = [
  {
    id: '1',
    name: 'Mele Biologiche',
    quantity: 1,
    unit: 'kg',
    prices: { famila: 2.99, lidl: 2.49, primoprezzo: 3.20 },
  },
  {
    id: '2',
    name: 'Latte Intero',
    quantity: 2,
    unit: 'L',
    prices: { famila: 1.15, lidl: 0.99, primoprezzo: 1.25 },
  },
  {
    id: '3',
    name: 'Pane a Lievitazione Naturale',
    quantity: 1,
    unit: 'filone',
    prices: { famila: 3.50, primoprezzo: 3.80 },
  },
  {
    id: '4',
    name: 'Uova da Allevamento a Terra',
    quantity: 12,
    unit: 'pezzi',
    prices: { lidl: 2.80 },
  },
];


export default function Home() {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    const validPrices = Object.entries(item.prices)
      .filter(([, price]) => typeof price === 'number' && price > 0)
      .map(([store, price]) => ({ store, price: price! }));

    if (validPrices.length === 0) return total;

    const cheapest = validPrices.reduce((min, p) => (p.price < min.price ? p : min));
    let selectedPrice = cheapest.price;

    const familaPrice = item.prices.famila;
    if (familaPrice && familaPrice <= cheapest.price * 1.20) {
      selectedPrice = familaPrice;
    }

    return total + selectedPrice * item.quantity;
  }, 0).toFixed(2);


  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight sm:text-2xl">
              SpesaIntelligente
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <AddItemSheet
              open={isSheetOpen}
              onOpenChange={setIsSheetOpen}
              onAddItem={handleAddItem}
            >
              <Button onClick={() => setIsSheetOpen(true)} className="group">
                 Aggiungi Articolo
                 <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              </Button>
            </AddItemSheet>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">La Mia Lista della Spesa</h2>
            <p className="text-muted-foreground">Rivedi e gestisci gli articoli qui sotto.</p>
          </div>
          {isClient && (
            <div className="flex items-baseline gap-2 rounded-full bg-primary/10 px-4 py-2 text-lg font-bold text-primary">
              <span>Totale Stimato:</span>
              <span>€{totalCost}</span>
            </div>
          )}
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
          <div className="mt-16 flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 py-16 text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">La tua lista è vuota</h3>
            <p className="max-w-xs">Clicca "Aggiungi Articolo" per iniziare a compilare la tua lista della spesa.</p>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SpesaIntelligente. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
