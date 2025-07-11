"use client";

import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import type { DietPlan, DayType, DietFoodItem, WeekPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "./ui/scroll-area";

interface DietSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (diet: DietPlan) => void;
  initialDiet: DietPlan;
}

const WEEK_DAYS: { key: keyof WeekPlan; label: string }[] = [
    { key: 'monday', label: 'Lunedì' },
    { key: 'tuesday', label: 'Martedì' },
    { key: 'wednesday', label: 'Mercoledì' },
    { key: 'thursday', label: 'Giovedì' },
    { key: 'friday', label: 'Venerdì' },
    { key: 'saturday', label: 'Sabato' },
    { key: 'sunday', label: 'Domenica' },
];

export function DietSheet({ open, onOpenChange, onSave, initialDiet }: DietSheetProps) {
  const [dayTypes, setDayTypes] = useState<DayType[]>(initialDiet.dayTypes);
  const [week, setWeek] = useState<WeekPlan>(initialDiet.week);

  const handleSave = () => {
    onSave({ dayTypes, week });
  };

  const addDayType = () => {
    const newDay: DayType = {
      id: `day-type-${Date.now()}`,
      name: `Giorno ${dayTypes.length + 1}`,
      items: [],
    };
    setDayTypes([...dayTypes, newDay]);
  };

  const removeDayType = (id: string) => {
    setDayTypes(dayTypes.filter((d) => d.id !== id));
    // Also clear this day type from the week plan
    const newWeek = { ...week };
    Object.keys(newWeek).forEach(day => {
      const d = day as keyof WeekPlan;
      if (newWeek[d] === id) {
        newWeek[d] = null;
      }
    });
    setWeek(newWeek);
  };

  const updateDayTypeName = (id: string, name: string) => {
    setDayTypes(dayTypes.map((d) => (d.id === id ? { ...d, name } : d)));
  };

  const addFoodItem = (dayTypeId: string) => {
    const newItem: DietFoodItem = {
      id: `food-${Date.now()}`,
      name: "",
      quantity: 0,
      unit: "g",
    };
    setDayTypes(
      dayTypes.map((d) =>
        d.id === dayTypeId ? { ...d, items: [...d.items, newItem] } : d
      )
    );
  };

  const updateFoodItem = (dayTypeId: string, updatedItem: DietFoodItem) => {
    setDayTypes(
      dayTypes.map((d) =>
        d.id === dayTypeId
          ? {
              ...d,
              items: d.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
            }
          : d
      )
    );
  };

  const removeFoodItem = (dayTypeId: string, itemId: string) => {
    setDayTypes(
      dayTypes.map((d) =>
        d.id === dayTypeId
          ? { ...d, items: d.items.filter((i) => i.id !== itemId) }
          : d
      )
    );
  };
  
  const handleWeekDayChange = (day: keyof WeekPlan, dayTypeId: string) => {
    setWeek(prev => ({ ...prev, [day]: dayTypeId === "none" ? null : dayTypeId }));
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-full w-full">
        <SheetHeader>
          <SheetTitle>Gestisci il Tuo Piano Dieta</SheetTitle>
          <SheetDescription>
            Crea "piani giornalieri", aggiungi alimenti e assegnali alla tua settimana.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4 -mr-6">
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Piani Giornalieri</h3>
              <div className="space-y-4">
                {dayTypes.map((dayType) => (
                  <div key={dayType.id} className="rounded-lg border p-4 space-y-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Input
                        value={dayType.name}
                        onChange={(e) => updateDayTypeName(dayType.id, e.target.value)}
                        className="font-bold text-base"
                        readOnly
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeDayType(dayType.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                        {dayType.items.map(item => (
                            <FoodItemRow 
                                key={item.id}
                                item={item}
                                onUpdate={(updated) => updateFoodItem(dayType.id, updated)}
                                onDelete={() => removeFoodItem(dayType.id, item.id)}
                            />
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addFoodItem(dayType.id)}>
                      <Plus className="w-4 h-4 mr-2" /> Aggiungi Alimento
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="mt-4 w-full" onClick={addDayType}>
                <Plus className="w-4 h-4 mr-2" /> Aggiungi Piano Giornaliero
              </Button>
            </div>

            <div className="border-t pt-6">
               <h3 className="text-lg font-semibold mb-3">Piano Settimanale</h3>
               <div className="grid grid-cols-1 gap-4">
                 {WEEK_DAYS.map(({key, label}) => (
                   <div key={key} className="flex items-center justify-between gap-4">
                      <p className="font-medium text-base w-24 flex-shrink-0">{label}</p>
                      <Select
                        value={week[key] ?? "none"}
                        onValueChange={(value) => handleWeekDayChange(key, value)}
                      >
                        <SelectTrigger id={`day-select-${key}`}>
                          <SelectValue placeholder="Seleziona un piano..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessuno</SelectItem>
                          {dayTypes.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter>
          <Button onClick={handleSave} className="w-full" size="lg">Salva Dieta</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Sub-component for a single food item row
interface FoodItemRowProps {
    item: DietFoodItem;
    onUpdate: (item: DietFoodItem) => void;
    onDelete: () => void;
}

function FoodItemRow({ item, onUpdate, onDelete }: FoodItemRowProps) {
    return (
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
            <Input
              placeholder="Nome alimento"
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="flex-grow"
            />
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate({ ...item, quantity: parseFloat(e.target.value) || 0 })}
              className="w-20"
            />
            <div className="w-20 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">{item.unit}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
        </div>
    )
}
