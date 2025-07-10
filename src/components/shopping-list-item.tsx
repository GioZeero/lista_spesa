"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import type { ShoppingItem, Store } from "@/types";
import { stores } from "@/types";
import { cn } from "@/lib/utils";

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setPrices(item.prices);
  }, [item.prices]);

  const handlePriceChange = (store: Store, value: string) => {
    const newPrice = value === "" ? undefined : parseFloat(value);
    const newPrices = { ...prices, [store]: newPrice };
    setPrices(newPrices);
    onUpdate({ ...item, prices: newPrices });
  };
  
  const autoSelectedStore = useMemo(() => {
    const validPrices = Object.entries(prices)
      .filter(([, price]) => typeof price === 'number' && price > 0)
      .map(([store, price]) => ({ store: store as Store, price: price! }));

    if (validPrices.length === 0) return null;

    const cheapest = validPrices.reduce((min, p) => (p.price < min.price ? p : min));
    
    const familaPrice = prices.famila;
    if (familaPrice !== undefined && familaPrice <= cheapest.price * 1.20) {
      return { store: 'famila' as Store, price: familaPrice };
    }

    return cheapest;
  }, [prices]);
  
  const getFooterText = () => {
    if (autoSelectedStore) {
      return autoSelectedStore.store.charAt(0).toUpperCase() + autoSelectedStore.store.slice(1);
    }
    return "Nessun prezzo";
  };

  const footerText = getFooterText();

  const getPriceForFooter = () => {
    if (autoSelectedStore) {
      return `€${(autoSelectedStore.price * item.quantity).toFixed(2)}`;
    }
    return "";
  }

  const priceText = getPriceForFooter();

  return (
    <Card className="flex flex-col rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-xl">{item.name}</CardTitle>
          <CardDescription className="font-medium text-primary">
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
      <CardContent className="flex-grow space-y-2">
          {stores.map((store) => {
            const isSelected = autoSelectedStore?.store === store;

            return (
              <div 
                key={store} 
                data-state={isSelected ? 'selected' : 'unselected'}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border p-3 transition-all",
                  "data-[state=selected]:border-primary data-[state=selected]:bg-primary/5 data-[state=selected]:ring-1 data-[state=selected]:ring-primary"
                )}
              >
                <Label htmlFor={`${item.id}-${store}`} className="flex-1 capitalize text-sm font-medium">
                  {store}
                </Label>
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                  <Input
                    id={`${item.id}-${store}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={prices[store] ?? ""}
                    onChange={(e) => handlePriceChange(store, e.target.value)}
                    className="pl-7 text-right font-semibold"
                  />
                </div>
              </div>
            );
          })}
      </CardContent>
      {isClient && (
        <CardFooter className="pt-4">
          <div className="flex w-full items-center justify-between rounded-lg bg-muted p-3 text-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn("h-5 w-5", autoSelectedStore ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-semibold text-foreground">
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
