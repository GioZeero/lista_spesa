"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ShoppingCart, NotebookPen, Utensils, Search, Loader2 } from "lucide-react";
import type { ShoppingItem, DietPlan, Store, Freshness } from "@/types";
import { DietSheet } from "@/components/diet-sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { ShoppingListItemCard } from "@/components/shopping-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDietPlan, getShoppingList, updateDietPlan, updateShoppingItem } from "@/lib/firebase";


export default function Home() {
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const dietData = await getDietPlan();
      const shoppingListData = await getShoppingList();
      
      setDiet(dietData);
      
      if (shoppingListData.length > 0) {
        setShoppingList(shoppingListData);
      } else if (dietData) {
        // Generate shopping list from diet if it doesn't exist yet
        updateShoppingList(dietData);
      }

    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const updateShoppingList = useCallback(async (currentDiet: DietPlan) => {
    const aggregatedItems: { [key: string]: { quantity: number; unit: string; prices: Partial<Record<Store, number>> } } = {};

    Object.values(currentDiet.week).forEach(dayTypeId => {
      if (!dayTypeId) return;
      const dayType = currentDiet.dayTypes.find(d => d.id === dayTypeId);
      if (dayType) {
        dayType.items.forEach(item => {
          if (!item.name || item.quantity <= 0) return;
          const quantityInGrams = item.unit.toLowerCase() === 'g' ? item.quantity : item.quantity * 1000;
          
          if (aggregatedItems[item.name]) {
            aggregatedItems[item.name].quantity += quantityInGrams;
          } else {
            aggregatedItems[item.name] = {
              quantity: quantityInGrams,
              unit: 'g',
              prices: item.prices || {},
            };
          }
        });
      }
    });

    const newList: ShoppingItem[] = await Promise.all(
      Object.entries(aggregatedItems).map(async ([name, data]) => {
        const quantityInKg = data.quantity / 1000;
        const existingItem = shoppingList.find(i => i.name === name);
        const newItem: ShoppingItem = {
          id: name, // Use name as a persistent ID
          name,
          quantity: parseFloat(quantityInKg.toFixed(2)),
          unit: 'kg',
          prices: existingItem?.prices || data.prices, // Preserve existing prices
          freshness: existingItem?.freshness || 'green',
          isHighlighted: existingItem?.isHighlighted || false,
        };
        await updateShoppingItem(newItem); // Create or update in DB
        return newItem;
      })
    );
    
    // Remove items that are no longer in the diet
    for (const item of shoppingList) {
      if (!newList.some(i => i.name === item.name)) {
        // await deleteShoppingItem(item.id); // Optional: decide if you want to delete or just hide
      }
    }

    setShoppingList(newList);
  }, [shoppingList]);
  
  const handleUpdateItem = async (updatedItem: ShoppingItem) => {
    setShoppingList((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    await updateShoppingItem(updatedItem);
  };

  const handleSaveDiet = async (newDiet: DietPlan) => {
    await updateDietPlan(newDiet);
    setDiet(newDiet);
    await updateShoppingList(newDiet);
    setIsSheetOpen(false);
  };

  const totalCost = useMemo(() => shoppingList.reduce((total, item) => {
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
  }, 0).toFixed(2), [shoppingList]);

  const filteredAndSortedList = useMemo(() => {
    const freshnessOrder: Record<Freshness, number> = { red: 0, yellow: 1, green: 2 };

    return shoppingList
      .filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortOrder) {
          case 'alphabetical':
            return a.name.localeCompare(b.name);
          case 'freshness':
            return freshnessOrder[a.freshness] - freshnessOrder[b.freshness];
          case 'highlighted':
            return (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0);
          default:
            // Default sort might be by name if nothing else
            return a.name.localeCompare(b.name);
        }
      });
  }, [shoppingList, searchQuery, sortOrder]);


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
            <Button onClick={() => setIsSheetOpen(true)} className="group" disabled={loading}>
               Gestisci Dieta
               <NotebookPen className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {diet && <DietSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSave={handleSaveDiet}
        initialDiet={diet}
      />}

      <main className="container mx-auto max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        {loading ? (
            <div className="mt-16 flex flex-col items-center gap-4 text-center text-muted-foreground">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <h3 className="text-xl font-semibold">Caricamento dati...</h3>
                <p className="max-w-xs">Recupero del tuo piano spesa da Firebase.</p>
            </div>
        ) : (
          <>
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
            
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
               <div className="relative lg:col-span-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Cerca alimento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
               </div>
               <div className="lg:col-span-2">
                 <Select value={sortOrder} onValueChange={setSortOrder}>
                   <SelectTrigger className="w-full">
                     <SelectValue placeholder="Ordina per..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="default">Ordine predefinito</SelectItem>
                     <SelectItem value="alphabetical">Alfabetico (A-Z)</SelectItem>
                     <SelectItem value="freshness">Livello di scadenza</SelectItem>
                     <SelectItem value="highlighted">Da comprare</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </div>

            {filteredAndSortedList.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedList.map((item) => (
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
                <h3 className="text-xl font-semibold">Nessun Articolo Trovato</h3>
                <p className="max-w-xs">La tua lista della spesa è vuota. Clicca su "Gestisci Dieta" per iniziare ad aggiungere alimenti.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} ShopSmart. Tutti i diritti riservati.</span>
      </footer>
    </div>
  );
}

    