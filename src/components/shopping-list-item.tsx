"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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
      return `Selezionato: ${selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1)} a €${prices[selectedStore]!.toFixed(2)}`;
    }
    if (cheapest) {
      return `Più economico da ${cheapest.store} a €${cheapest.price.toFixed(2)}`;
    }
    return null;
  };

  const footerText = getFooterText();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span className="font-headline">{item.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Elimina Articolo</span>
          </Button>
        </CardTitle>
        <CardDescription>
          {item.quantity} {item.unit}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <RadioGroup 
          value={selectedStore ?? ""}
          onValueChange={(value) => handleStoreSelectionChange(value as Store)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
        >
          {stores.map((store) => (
            <div key={store} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <RadioGroupItem value={store} id={`${store}-radio-${item.id}`} />
                <Label htmlFor={`${store}-radio-${item.id}`} className="capitalize cursor-pointer">
                  {store}
                </Label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  €
                </span>
                <Input
                  id={`${store}-input-${item.id}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={prices[store] ?? ""}
                  onChange={(e) => handlePriceChange(store, e.target.value)}
                  className={cn(
                    "pl-6",
                    (selectedStore === store || (!selectedStore && cheapest?.store === store)) && "border-accent ring-2 ring-accent"
                  )}
                />
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      {footerText && (
        <CardFooter>
          <div className="flex w-full items-center justify-center rounded-md bg-accent/10 p-3 text-center">
            <p className="text-sm font-medium text-accent-foreground">
              {footerText}
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
