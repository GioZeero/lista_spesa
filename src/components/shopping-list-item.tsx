"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAiSuggestions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingItem, Store } from "@/types";
import { stores } from "@/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Badge } from "./ui/badge";
import { SuggestSavingsOutput } from "@/ai/flows/suggest-savings";

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
  const { toast } = useToast();
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestSavingsOutput | null>(null);
  const [isAiLoading, startAiTransition] = useTransition();

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

  const handleGetAiSuggestions = () => {
    startAiTransition(async () => {
      try {
        const result = await getAiSuggestions({
            item: item.name,
            quantity: item.quantity,
            unit: item.unit,
            familaPrice: prices.famila,
            lidlPrice: prices.lidl,
            primoprezzoPrice: prices.primoprezzo
        });
        setAiSuggestions(result);
        setIsAiDialogOpen(true);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "AI Suggestion Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      }
    });
  };

  return (
    <>
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
          {cheapest && (
            <div className="!mt-4 flex items-center justify-center rounded-md bg-accent/10 p-3 text-center">
              <p className="text-sm font-medium text-accent-foreground">
                Cheapest at <span className="capitalize font-bold">{cheapest.store}</span> for ${cheapest.price.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGetAiSuggestions}
            disabled={isAiLoading}
          >
            {isAiLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
            )}
            Get AI Savings Suggestion
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Savings Suggestions for {item.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Here are some alternatives to help you save money.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {aiSuggestions?.suggestedAlternatives && aiSuggestions.suggestedAlternatives.length > 0 ? (
                <div className="space-y-4">
                    {aiSuggestions.suggestedAlternatives.map((alt, index) => (
                        <div key={index} className="rounded-lg border p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">{alt.alternativeItem}</h4>
                                    <p className="text-sm text-muted-foreground">at <span className="capitalize font-bold">{alt.store}</span></p>
                                </div>
                                <Badge variant="secondary">${alt.price.toFixed(2)}</Badge>
                            </div>
                            <p className="text-sm mt-2">{alt.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">Price per unit: ${alt.pricePerUnit.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No better alternatives found at the moment.</p>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
