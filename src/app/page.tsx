
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ShoppingCart, NotebookPen, Utensils, Search, Loader2 } from "lucide-react";
import type { ShoppingItem, DietPlan, Store, Freshness, Profiles } from "@/types";
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
import { getDietPlan, getShoppingList, updateDietPlan, updateShoppingItem, getAllDietPlans, batchUpdateShoppingList, deleteProfile } from "@/lib/firebase";


const DEFAULT_PROFILE_ID = 'principale';

export default function Home() {
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState(DEFAULT_PROFILE_ID);


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const updateShoppingList = useCallback(async (allProfiles: Profiles) => {
    const aggregatedItems: { [key: string]: { name: string; quantityInGrams: number; prices: Partial<Record<Store, number>> } } = {};

    for (const profileId in allProfiles) {
        const currentDiet = allProfiles[profileId];
        if (!currentDiet || !currentDiet.dayTypes || !currentDiet.week) continue;

        const dayTypeUsageCount: Record<string, number> = {};
        for (const day of Object.values(currentDiet.week)) {
            if (day) {
                dayTypeUsageCount[day] = (dayTypeUsageCount[day] || 0) + 1;
            }
        }
        
        currentDiet.dayTypes.forEach(dayType => {
            const usageMultiplier = dayTypeUsageCount[dayType.id] || 0;
            if (usageMultiplier === 0) return;

            const meals = [
                ...(dayType.breakfast || []),
                ...(dayType.lunch || []),
                ...(dayType.dinner || [])
            ];

            meals.forEach(item => {
                if (!item.name || !item.quantity) return;

                const cleanedName = item.name.trim();
                if (!cleanedName) return;

                const key = cleanedName.toLowerCase();
                const quantityInGrams = item.unit === 'kg' ? item.quantity * 1000 : item.quantity;
                const totalQuantity = quantityInGrams * usageMultiplier;

                if (aggregatedItems[key]) {
                    aggregatedItems[key].quantityInGrams += totalQuantity;
                } else {
                    aggregatedItems[key] = {
                        name: cleanedName,
                        quantityInGrams: totalQuantity,
                        prices: item.prices || {},
                    };
                }
            });
        });
    }

    const existingList = await getShoppingList();
    const newList: ShoppingItem[] = [];

    for (const data of Object.values(aggregatedItems)) {
        if(data.quantityInGrams === 0) continue;
        
        const useKg = data.quantityInGrams >= 1000;
        const finalQuantity = useKg ? data.quantityInGrams / 1000 : data.quantityInGrams;
        const finalUnit = useKg ? 'kg' : 'g';

        const sanitizedId = data.name.trim().toLowerCase().replace(/[.#$[\]/]/g, '_');
        const existingItem = existingList.find(i => i.id === sanitizedId);
        
        const newItem: ShoppingItem = {
            id: sanitizedId,
            name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            quantity: parseFloat(finalQuantity.toFixed(2)),
            unit: finalUnit,
            prices: existingItem?.prices || data.prices || {},
            freshness: existingItem?.freshness || 'blue',
            isHighlighted: existingItem?.isHighlighted || false,
        };
        newList.push(newItem);
    }
    
    await batchUpdateShoppingList(newList);
    setShoppingList(newList);
}, []);


 const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setFirebaseError(null);
    try {
      const [profilesData, shoppingListData] = await Promise.all([
        getAllDietPlans(),
        getShoppingList()
      ]);
      
      setProfiles(profilesData);
      setShoppingList(shoppingListData);

      if (Object.keys(profilesData).length > 0) {
        await updateShoppingList(profilesData);
      }

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
  }, [updateShoppingList]);


  useEffect(() => {
    if (isClient) {
      fetchInitialData();
    }
  }, [isClient, fetchInitialData]);

  const handleUpdateItem = async (updatedItem: ShoppingItem) => {
    setShoppingList((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    await updateShoppingItem(updatedItem);
  };

  const handleSaveDiet = async (profileId: string, newDiet: DietPlan) => {
    setLoading(true);
    await updateDietPlan(profileId, newDiet);
    
    const updatedProfiles = {
        ...profiles,
        [profileId]: newDiet,
    };
    setProfiles(updatedProfiles as Profiles);
    
    await updateShoppingList(updatedProfiles as Profiles);
    
    setActiveProfileId(profileId);
    setIsSheetOpen(false);
    setLoading(false);
  };

  const handleDeleteProfile = async (profileId: string) => {
    setLoading(true);
    await deleteProfile(profileId);
    
    const newProfiles = { ...profiles };
    delete newProfiles[profileId];
    setProfiles(newProfiles);
    
    await updateShoppingList(newProfiles);
    
    // Switch to default profile after deletion
    setActiveProfileId(DEFAULT_PROFILE_ID); 
    
    setLoading(false);
  };

  const totalCost = useMemo(() => {
    return shoppingList.reduce((total, item) => {
      const itemPrices = item.prices || {};
      const validPrices = Object.values(itemPrices).filter((p): p is number => typeof p === 'number' && p > 0);
  
      if (validPrices.length === 0) {
        return total;
      }
  
      const cheapestPrice = Math.min(...validPrices);
      const familaPrice = itemPrices.famila;
  
      let selectedPrice = cheapestPrice;
      if (familaPrice !== undefined && familaPrice !== null && familaPrice <= cheapestPrice * 1.20) {
        selectedPrice = familaPrice;
      }
      
      const quantityInKg = item.unit === 'g' ? item.quantity / 1000 : item.quantity;
      return total + (selectedPrice * quantityInKg);
    }, 0).toFixed(2);
  }, [shoppingList]);
  
  const filteredAndSortedList = useMemo(() => {
    const freshnessOrder: Record<Freshness, number> = { red: 0, yellow: 1, blue: 2 };

    return [...shoppingList]
      .filter(item =>
        item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortOrder === 'default') {
            if (a.isHighlighted !== b.isHighlighted) {
              return (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0);
            }
            return a.name.localeCompare(b.name);
        }
        if (sortOrder === 'alphabetical') {
            return a.name.localeCompare(b.name);
        }
        if (sortOrder === 'freshness') {
            return freshnessOrder[a.freshness] - freshnessOrder[b.freshness];
        }
        return 0;
      });
  }, [shoppingList, searchQuery, sortOrder]);
  
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

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
            {profiles && <DietSheet
              open={isSheetOpen}
              onOpenChange={setIsSheetOpen}
              onSave={handleSaveDiet}
              onDeleteProfile={handleDeleteProfile}
              initialProfileId={activeProfileId}
              onProfileChange={setActiveProfileId}
              profiles={profiles}
            />}
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">Lista della Spesa Globale</h2>
                <p className="text-muted-foreground">Articoli da tutti i profili per una spesa efficiente.</p>
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
                      <SelectItem value="default">Da comprare</SelectItem>
                      <SelectItem value="alphabetical">Alfabetico (A-Z)</SelectItem>
                      <SelectItem value="freshness">Livello di scadenza</SelectItem>
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

      <footer className="sticky bottom-0 mt-auto w-full border-t border-border/40 bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-2 rounded-full bg-primary/10 px-4 py-2 text-lg font-bold text-primary">
                <span>Costo Totale Stimato:</span>
                <span>€{totalCost}</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
                {year && <span>© {year} ShopSmart. Tutti i diritti riservati.</span>}
            </p>
          </div>
      </footer>
    </div>
  );
}
