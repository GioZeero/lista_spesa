"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingItem, Store } from "@/types";
import { stores } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ShoppingListItemProps {
  item: ShoppingItem;
  onUpdate: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export function ShoppingListItemCard({
  item,
  onUpdate,
  onDelete,
}: ShoppingListItemProps) {
  const [prices, setPrices] = useState(item.prices);
  const [selectedStore, setSelectedStore] = useState<Store | null | undefined>(item.selectedStore);
  const [isClient, setIsClient] = useState(false);
  const baseId = useId();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setPrices(item.prices);
    setSelectedStore(item.selectedStore);
  }, [item.prices, item.selectedStore]);

  const handlePriceChange = (store: Store, value: string) => {
    const newPrice = value === "" ? undefined : parseFloat(value);
    const newPrices = { ...prices, [store]: newPrice };
    setPrices(newPrices);
    onUpdate({ ...item, prices: newPrices });
  };
  
  const handleStoreSelectionChange = (store: Store) => {
    const newSelectedStore = store === selectedStore ? null : store;
    setSelectedStore(newSelectedStore);
    onUpdate({ ...item, selectedStore: newSelectedStore });
  };

  const cheapest = useMemo(() => {
    const validPrices = Object.entries(prices)
      .filter(([, price]) => price !== undefined && price > 0)
      .map(([store, price]) => ({ store: store as Store, price: price! }));

    if (validPrices.length === 0) return null;

    return validPrices.reduce((min, p) => (p.price < min.price ? p : min));
  }, [prices]);
  
  const getFooterText = () => {
    if (selectedStore && prices[selectedStore]) {
      return `Selezionato: ${selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1)}`;
    }
    if (cheapest) {
      return `Più economico da ${cheapest.store.charAt(0).toUpperCase() + cheapest.store.slice(1)}`;
    }
    return "Nessun prezzo inserito";
  };

  const footerText = getFooterText();

  const getPriceForFooter = () => {
    if (selectedStore && prices[selectedStore]) {
      return `€${prices[selectedStore]!.toFixed(2)}`;
    }
    if (cheapest) {
      return `€${cheapest.price.toFixed(2)}`;
    }
    return "";
  }

  const priceText = getPriceForFooter();

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
          <CardDescription>
            {item.quantity} {item.unit}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive rounded-full"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Elimina Articolo</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <RadioGroup 
          value={selectedStore ?? ""}
          onValueChange={(value) => handleStoreSelectionChange(value as Store)}
          className="space-y-3"
        >
          {stores.map((store) => {
            const radioId = `${baseId}-${store}-radio`;
            const inputId = `${baseId}-${store}-input`;
            const isCheapest = !selectedStore && cheapest?.store === store;
            const isSelected = selectedStore === store;

            return (
              <div 
                key={store} 
                data-state={isSelected ? 'selected' : 'unselected'}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all",
                  "data-[state=selected]:border-primary data-[state=selected]:ring-2 data-[state=selected]:ring-primary/50"
                )}
              >
                <RadioGroupItem value={store} id={radioId} />
                <Label htmlFor={radioId} className="flex-1 capitalize cursor-pointer text-base">
                  {store}
                </Label>
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                  <Input
                    id={inputId}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={prices[store] ?? ""}
                    onChange={(e) => handlePriceChange(store, e.target.value)}
                    className={cn(
                      "pl-7 text-right",
                      isCheapest && "border-green-500/50"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
      {isClient && (
        <CardFooter>
          <div className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn("h-5 w-5", (selectedStore || cheapest) ? "text-green-500" : "text-muted-foreground")} />
              <p className="text-sm font-medium text-secondary-foreground">
                {footerText}
              </p>
            </div>
            <p className="text-lg font-bold text-foreground">{priceText}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
