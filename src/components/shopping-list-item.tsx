"use client";

import { useMemo, useState } from "react";
import { ShoppingCart, Trash2, Pencil } from "lucide-react";
import type { ShoppingItem, Store, Freshness } from "@/types";
import { stores } from "@/types";
import { cn } from "@/lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ShoppingListItemProps {
  item: ShoppingItem;
  onUpdate: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

const freshnessConfig: Record<Freshness, { color: string; label: string }> = {
  green: { color: 'bg-green-500', label: 'Fresco (> 6 giorni)' },
  yellow: { color: 'bg-yellow-500', label: 'In scadenza (3-6 giorni)' },
  red: { color: 'bg-red-500', label: 'Urgente (< 3 giorni)' },
};

export function ShoppingListItemCard({
  item,
  onUpdate,
  onDelete,
}: ShoppingListItemProps) {
  const [prices, setPrices] = useState(item.prices);
  const [freshness, setFreshness] = useState<Freshness>(item.freshness);

  const handlePriceChange = (store: Store, value: string) => {
    const newPrice = value === "" ? undefined : parseFloat(value);
    const newPrices = { ...prices, [store]: newPrice };
    setPrices(newPrices);
    onUpdate({ ...item, prices: newPrices });
  };
  
  const handleFreshnessChange = (newFreshness: Freshness) => {
    setFreshness(newFreshness);
    onUpdate({ ...item, freshness: newFreshness });
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
  
  const getPriceForFooter = () => {
    if (autoSelectedStore) {
      return `€${(autoSelectedStore.price * item.quantity).toFixed(2)}`;
    }
    return "N/A";
  }

  const priceText = getPriceForFooter();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={item.id} className="border-none">
        <Card className="flex flex-col rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1">
          <div className="flex flex-col p-6">
             <div className="flex items-start justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <span className={cn("h-3 w-3 rounded-full flex-shrink-0", freshnessConfig[freshness].color)}></span>
                    <div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <p className="font-medium text-primary">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
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
            </div>
            
            <div className="mt-4 flex w-full items-center justify-between rounded-lg bg-muted p-3 text-center">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold capitalize text-foreground">
                        {autoSelectedStore?.store ?? 'Nessun negozio'}
                    </p>
                </div>
                <p className="text-lg font-bold text-foreground">{priceText}</p>
            </div>
          </div>

          <AccordionTrigger className="group justify-start px-6 py-2 text-sm text-muted-foreground hover:no-underline">
            <div className="flex items-center gap-1">
                <Pencil className="h-3 w-3" /> Modifica
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <div className="px-6 pb-6 pt-0 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Modifica i prezzi al kg per ogni negozio.</p>
                  <div className="space-y-3">
                  {stores.map((store) => (
                    <div key={store} className="flex items-center gap-3">
                      <Label htmlFor={`${item.id}-${store}`} className="flex-1 capitalize text-sm font-medium">
                        {store}
                      </Label>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        <Input
                          id={`${item.id}-${store}`}
                          type="number"
                          step="0.01"
                          value={prices[store] ?? ""}
                          onChange={(e) => handlePriceChange(store, e.target.value)}
                          placeholder="0.00"
                          className="pl-6 text-right"
                        />
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
                <Separator />
                <div>
                   <p className="text-xs text-muted-foreground mb-2">Imposta la freschezza del prodotto.</p>
                   <div className="flex items-center justify-between gap-2">
                      {(['green', 'yellow', 'red'] as Freshness[]).map((level) => (
                         <Button
                            key={level}
                            variant={freshness === level ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFreshnessChange(level)}
                            className="flex-1"
                         >
                           <span className={cn("h-3 w-3 rounded-full mr-2", freshnessConfig[level].color)}></span>
                           {freshnessConfig[level].label.split('(')[0].trim()}
                         </Button>
                      ))}
                   </div>
                </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
