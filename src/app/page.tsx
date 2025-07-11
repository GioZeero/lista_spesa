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
import { getDietPlan, getShoppingList, updateDietPlan, updateShoppingItem, deleteShoppingItem, batchUpdateShoppingList } from "@/lib/firebase";


export default function Home() {
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setFirebaseError(null);
    try {
      const dietData = await getDietPlan();
      const shoppingListData = await getShoppingList();
      
      setDiet(dietData);
      setShoppingList(shoppingListData);

    } catch (error: any) {
      console.error("Error fetching data from Firebase:", error);
      if (error.message.includes("FIREBASE FATAL ERROR")) {
        setFirebaseError(error.message);
      } else {
        setFirebaseError("An unknown error occurred while connecting to the database.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchInitialData();
    }
  }, [isClient, fetchInitialData]);

  const updateShoppingList = useCallback(async (currentDiet: DietPlan) => {
    const aggregatedItems: { [key: string]: { quantity: number; unit: string; prices: Partial<Record<Store, number>> } } = {};

    // Iterate over all day types to collect all possible food items
    currentDiet.dayTypes.forEach(dayType => {
      dayType.items.forEach(item => {
        if (!item.name) return; // Skip if item has no name
        const key = item.name.toLowerCase();
        
        let quantityInGrams = 0;
        // Check if the dayType is actually used in the week to aggregate quantities
        const isDayTypeUsed = Object.values(currentDiet.week).includes(dayType.id);
        if (isDayTypeUsed) {
          quantityInGrams = item.unit.toLowerCase() === 'g' ? item.quantity : item.quantity * 1000;
        }

        if (aggregatedItems[key]) {
          aggregatedItems[key].quantity += quantityInGrams;
        } else {
          aggregatedItems[key] = {
            quantity: quantityInGrams,
            unit: 'g',
            prices: item.prices || {},
          };
        }
      });
    });

    const existingList = await getShoppingList();
    const newList: ShoppingItem[] = [];

    for (const [name, data] of Object.entries(aggregatedItems)) {
        const finalQuantity = data.quantity >= 1000 ? data.quantity / 1000 : data.quantity;
        const finalUnit = data.quantity >= 1000 ? 'kg' : 'g';
        const sanitizedId = name.replace(/[.#$[\]]/g, '_');
        const existingItem = existingList.find(i => i.id === sanitizedId);
        
        const newItem: ShoppingItem = {
          id: sanitizedId,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity: parseFloat(finalQuantity.toFixed(2)),
          unit: finalUnit,
          prices: existingItem?.prices || data.prices,
          freshness: existingItem?.freshness || 'green',
          isHighlighted: existingItem?.isHighlighted || false,
        };
        newList.push(newItem);
    }
    
    await batchUpdateShoppingList(newList);
    setShoppingList(newList);
}, []);


  const handleUpdateItem = async (updatedItem: ShoppingItem) => {
    setShoppingList((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    await updateShoppingItem(updatedItem);
  };

  const handleSaveDiet = async (newDiet: DietPlan) => {
    setLoading(true);
    await updateDietPlan(newDiet);
    setDiet(newDiet);
    await updateShoppingList(newDiet);
    setIsSheetOpen(false);
    setLoading(false);
  };

  const totalCost = useMemo(() => {
    return shoppingList.reduce((total, item) => {
      const validPrices = Object.values(item.prices).filter(price => typeof price === 'number' && price > 0);
  
      if (validPrices.length === 0) return total;
  
      const cheapestPrice = Math.min(...validPrices as number[]);
      const familaPrice = item.prices.famila;
  
      let selectedPrice = cheapestPrice;
      if (familaPrice !== undefined && familaPrice <= cheapestPrice * 1.20) {
        selectedPrice = familaPrice;
      }
  
      return total + selectedPrice * item.quantity;
    }, 0).toFixed(2);
  }, [shoppingList]);

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
            return a.name.localeCompare(b.name);
        }
      });
  }, [shoppingList, searchQuery, sortOrder]);

  if (!isClient) {
    return null;
  }

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
        {firebaseError ? (
            <div className="mt-16 flex flex-col items-center gap-4 text-center text-muted-foreground">
                 <h2 className="text-2xl font-bold text-destructive mb-4">Errore di Configurazione Firebase</h2>
                 <p className="text-muted-foreground mb-6">{firebaseError}</p>
                 <p className="text-sm text-muted-foreground">
                     Assicurati di aver impostato correttamente le variabili d'ambiente nel file <code className="bg-muted px-1 py-0.5 rounded">.env</code>, in particolare <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_FIREBASE_DATABASE_URL</code>.
                 </p>
            </div>
        ) : loading ? (
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
                <p className="max-w-xs">La tua lista della spesa è vuota o non è stata ancora generata. Clicca su "Gestisci Dieta" per iniziare.</p>
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
