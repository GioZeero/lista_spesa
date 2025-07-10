"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, NotebookPen, Utensils } from "lucide-react";
import type { ShoppingItem, DietPlan, Store } from "@/types";
import { DietSheet } from "@/components/diet-sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { ShoppingListItemCard } from "@/components/shopping-list-item";
import { Button } from "@/components/ui/button";

const initialDiet: DietPlan = {
  dayTypes: [
    {
      id: "day-type-1",
      name: "Giorno 1",
      items: [
        { id: 'item-1', name: 'Petto di Pollo', quantity: 200, unit: 'g' },
        { id: 'item-2', name: 'Riso Basmati', quantity: 80, unit: 'g' },
        { id: 'item-3', name: 'Broccoli', quantity: 150, unit: 'g' },
      ],
    },
    {
      id: "day-type-2",
      name: "Giorno 2",
      items: [
        { id: 'item-4', name: 'Salmone', quantity: 180, unit: 'g' },
        { id: 'item-5', name: 'Quinoa', quantity: 80, unit: 'g' },
        { id: 'item-6', name: 'Spinaci Freschi', quantity: 200, unit: 'g' },
      ],
    }
  ],
  week: {
    monday: "day-type-1",
    tuesday: "day-type-2",
    wednesday: "day-type-1",
    thursday: "day-type-2",
    friday: "day-type-1",
    saturday: "day-type-2",
    sunday: "day-type-1",
  },
};

const itemPrices: Record<string, ShoppingItem['prices']> = {
  'Petto di Pollo': { famila: 10.50, lidl: 9.80, primoprezzo: 11.00 },
  'Riso Basmati': { famila: 4.50, lidl: 4.20, primoprezzo: 4.80 },
  'Broccoli': { famila: 2.80, lidl: 2.50, primoprezzo: 3.00 },
  'Salmone': { famila: 22.00, lidl: 20.50, primoprezzo: 23.00 },
  'Quinoa': { famila: 8.00, lidl: 7.50, primoprezzo: 8.50 },
  'Spinaci Freschi': { famila: 3.50, lidl: 3.20, primoprezzo: 3.80 },
};


export default function Home() {
  const [diet, setDiet] = useState<DietPlan>(initialDiet);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    updateShoppingList(diet);
  }, [diet]);

  const updateShoppingList = (currentDiet: DietPlan) => {
    const aggregatedItems: { [key: string]: { quantity: number; unit: string } } = {};

    Object.values(currentDiet.week).forEach(dayTypeId => {
      if (!dayTypeId) return;
      const dayType = currentDiet.dayTypes.find(d => d.id === dayTypeId);
      if (dayType) {
        dayType.items.forEach(item => {
          const quantityInGrams = item.unit.toLowerCase() === 'g' ? item.quantity : item.quantity * 1000;
          
          if (aggregatedItems[item.name]) {
            aggregatedItems[item.name].quantity += quantityInGrams;
          } else {
            aggregatedItems[item.name] = {
              quantity: quantityInGrams,
              unit: 'g',
            };
          }
        });
      }
    });

    const newList: ShoppingItem[] = Object.entries(aggregatedItems).map(([name, data], index) => {
      const quantityInKg = data.quantity / 1000;
      return {
        id: `shopping-item-${index}`,
        name,
        quantity: parseFloat(quantityInKg.toFixed(2)),
        unit: 'kg',
        prices: itemPrices[name] || {},
        freshness: 'green',
      }
    });

    setShoppingList(newList);
  };
  
  const handleUpdateItem = (updatedItem: ShoppingItem) => {
    setShoppingList((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleSaveDiet = (newDiet: DietPlan) => {
    setDiet(newDiet);
    setIsSheetOpen(false);
  };

  const totalCost = shoppingList.reduce((total, item) => {
    const validPrices = Object.entries(item.prices)
      .filter(([, price]) => typeof price === 'number' && price > 0)
      .map(([store, price]) => ({ store: store as Store, price: price! }));

    if (validPrices.length === 0) return total;

    const cheapest = validPrices.reduce((min, p) => (p.price < min.price ? p : min));
    
    const familaPrice = item.prices.famila;
    let selectedStore = cheapest;

    if (familaPrice !== undefined && familaPrice <= cheapest.price * 1.20) {
      selectedStore = { store: 'famila', price: familaPrice };
    }

    return total + selectedStore.price * item.quantity;
  }, 0).toFixed(2);


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              ShopSmart
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsSheetOpen(true)} className="group">
               Gestisci Dieta
               <NotebookPen className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <DietSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSave={handleSaveDiet}
        initialDiet={diet}
      />

      <main className="container mx-auto max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Lista della Spesa Settimanale</h2>
            <p className="text-muted-foreground">Articoli aggregati dalla tua dieta per una spesa efficiente.</p>
          </div>
          <div className="flex items-baseline gap-2 rounded-full bg-primary/10 px-4 py-2 text-lg font-bold text-primary">
            <span>Costo Totale:</span>
            <span>€{totalCost}</span>
          </div>
        </div>

        {shoppingList.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shoppingList.map((item) => (
              <ShoppingListItemCard
                key={item.id}
                item={item}
                onUpdate={handleUpdateItem}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 py-16 text-center text-muted-foreground">
            <Utensils className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">La tua dieta è vuota</h3>
            <p className="max-w-xs">Clicca "Gestisci Dieta" per iniziare a compilare il tuo piano settimanale.</p>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        {currentYear && (
          <span>© {currentYear} ShopSmart. Tutti i diritti riservati.</span>
        )}
      </footer>
    </div>
  );
}
