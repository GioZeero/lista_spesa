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

  useEffect(() => {
    setPrices(item.prices);
  }, [item.prices]);

  const handlePriceChange = (store: Store, value: string) => {
    const newPrice = value === "" ? undefined : parseFloat(value);
    setPrices((prev) => ({ ...prev, [store]: newPrice }));
  };

  const handlePriceBlur = () => {
    onUpdate({ ...item, prices });
  };

  const cheapest = useMemo(() => {
    const validPrices = Object.entries(prices)
      .filter(([, price]) => price !== undefined && price > 0)
      .map(([store, price]) => ({ store: store as Store, price: price! }));

    if (validPrices.length === 0) return null;

    return validPrices.reduce((min, p) => (p.price < min.price ? p : min));
  }, [prices]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="font-headline">{item.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Item</span>
          </Button>
        </CardTitle>
        <CardDescription>
          {item.quantity} {item.unit}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stores.map((store) => (
            <div key={store} className="space-y-1.5">
              <Label htmlFor={`${store}-${item.id}`} className="capitalize">
                {store}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id={`${store}-${item.id}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={prices[store] ?? ""}
                  onChange={(e) => handlePriceChange(store, e.target.value)}
                  onBlur={handlePriceBlur}
                  className={cn(
                    "pl-6",
                    cheapest?.store === store && "border-accent ring-2 ring-accent"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {cheapest && (
        <CardFooter>
          <div className="flex w-full items-center justify-center rounded-md bg-accent/10 p-3 text-center">
            <p className="text-sm font-medium text-accent-foreground">
              Cheapest at <span className="capitalize font-bold">{cheapest.store}</span> for ${cheapest.price.toFixed(2)}
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
