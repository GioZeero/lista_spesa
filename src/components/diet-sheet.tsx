
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, User, Loader2, Salad, Soup, Pizza } from "lucide-react";
import type { DietPlan, DayType, DietFoodItem, WeekPlan, MealType } from "@/types";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "./ui/scroll-area";
import { getDietPlan, getProfileIds } from "@/lib/firebase";
import { Separator } from "./ui/separator";

interface DietSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (profileId: string, diet: DietPlan) => void;
  onDeleteProfile: (profileId: string) => void;
  initialProfileId: string;
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

const MEALS: { key: MealType, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { key: 'breakfast', label: 'Colazione', icon: Pizza },
    { key: 'lunch', label: 'Pranzo', icon: Soup },
    { key: 'dinner', label: 'Cena', icon: Salad },
];


export function DietSheet({ open, onOpenChange, onSave, onDeleteProfile, initialProfileId }: DietSheetProps) {
  const [currentProfileId, setCurrentProfileId] = useState(initialProfileId);
  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [newProfileName, setNewProfileName] = useState("");

  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const ids = await getProfileIds();
    if (!ids.includes(initialProfileId)) {
        ids.unshift(initialProfileId);
    }
    setProfileIds(ids);
  }, [initialProfileId]);

  const fetchDiet = useCallback(async (profileId: string) => {
    setLoading(true);
    const dietData = await getDietPlan(profileId);
    setDiet(dietData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchDiet(currentProfileId);
    }
  }, [open, currentProfileId, fetchDiet, fetchProfiles]);

  const handleProfileChange = (profileId: string) => {
    if (profileId) {
        setCurrentProfileId(profileId);
    }
  };

  const handleCreateProfile = () => {
    if (newProfileName.trim() && !profileIds.includes(newProfileName.trim())) {
      const newId = newProfileName.trim();
      setProfileIds(prev => [...prev, newId]);
      setCurrentProfileId(newId);
      setNewProfileName("");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (currentProfileId === initialProfileId) return;
    
    await onDeleteProfile(currentProfileId);
    
    const newProfileIds = profileIds.filter(id => id !== currentProfileId);
    setProfileIds(newProfileIds);
    setCurrentProfileId(initialProfileId);
  }


  const handleSave = () => {
    if (diet) {
      onSave(currentProfileId, diet);
    }
  };
  
  const updateDietState = (updater: (prev: DietPlan) => DietPlan) => {
    setDiet(prev => prev ? updater(prev) : null);
  }

  const addDayType = () => {
    const newDay: DayType = {
      id: `day-type-${Date.now()}`,
      name: `Giorno ${(diet?.dayTypes.length || 0) + 1}`,
      breakfast: [],
      lunch: [],
      dinner: [],
    };
    updateDietState(d => ({ ...d, dayTypes: [...d.dayTypes, newDay]}));
  };

  const removeDayType = (id: string) => {
    updateDietState(d => {
        const newDayTypes = d.dayTypes.filter(dt => dt.id !== id);
        const newWeek = { ...d.week };
        (Object.keys(newWeek) as Array<keyof WeekPlan>).forEach(day => {
            if (newWeek[day] === id) {
                newWeek[day] = null;
            }
        });
        return { ...d, dayTypes: newDayTypes, week: newWeek };
    });
  };
  
  const updateDayTypeName = (id: string, name: string) => {
    updateDietState(d => ({
        ...d,
        dayTypes: d.dayTypes.map(dt => dt.id === id ? {...dt, name} : dt)
    }));
  }

  const addFoodItem = (dayTypeId: string, meal: MealType) => {
    const newItem: DietFoodItem = {
      id: `food-${Date.now()}`,
      name: "",
      quantity: 0,
      unit: "g",
      prices: {},
    };
    updateDietState(d => ({
        ...d,
        dayTypes: d.dayTypes.map(dt =>
            dt.id === dayTypeId ? { ...dt, [meal]: [...(dt[meal] || []), newItem] } : dt
        )
    }));
  };

  const updateFoodItem = (dayTypeId: string, meal: MealType, updatedItem: DietFoodItem) => {
    updateDietState(d => ({
        ...d,
        dayTypes: d.dayTypes.map(dt => {
            if (dt.id !== dayTypeId) return dt;
            return {
                ...dt,
                [meal]: (dt[meal] || []).map(i => i.id === updatedItem.id ? updatedItem : i)
            }
        })
    }));
  };

  const removeFoodItem = (dayTypeId: string, meal: MealType, itemId: string) => {
     updateDietState(d => ({
        ...d,
        dayTypes: d.dayTypes.map(dt => {
            if (dt.id !== dayTypeId) return dt;
            return {
                ...dt,
                [meal]: (dt[meal] || []).filter(i => i.id !== itemId)
            }
        })
    }));
  };
  
  const handleWeekDayChange = (day: keyof WeekPlan, dayTypeId: string) => {
    updateDietState(d => ({
        ...d,
        week: { ...d.week, [day]: dayTypeId === "none" ? null : dayTypeId }
    }));
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Gestisci i Tuoi Piani Dieta</SheetTitle>
          <SheetDescription>
            Crea profili, piani giornalieri, aggiungi alimenti e assegnali alla settimana.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4 -mr-6">
          <Accordion type="multiple" className="w-full space-y-6 py-4">

            {/* Profile Management */}
             <AccordionItem value="profiles">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2 p-4 rounded-lg border bg-card data-[state=closed]:bg-muted/30">
                     <User className="w-5 h-5" />
                     Gestione Profilo
                </AccordionTrigger>
                <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                   <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Seleziona Profilo</label>
                          <div className="flex gap-2 items-center">
                           <Select value={currentProfileId} onValueChange={handleProfileChange}>
                             <SelectTrigger>
                               <SelectValue placeholder="Scegli un profilo..." />
                             </SelectTrigger>
                             <SelectContent>
                               {profileIds.map(id => (
                                 <SelectItem key={id} value={id}>
                                    {id.charAt(0).toUpperCase() + id.slice(1)}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={currentProfileId === initialProfileId}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sei sicuro di voler eliminare questo profilo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione non può essere annullata. Il profilo "<strong>{currentProfileId}</strong>" e tutti i suoi dati verranno eliminati permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteConfirmed}>Elimina</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">O Creane Uno Nuovo</label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Nome nuovo profilo..."
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                            />
                            <Button onClick={handleCreateProfile} disabled={!newProfileName.trim()}>Crea</Button>
                          </div>
                       </div>
                   </div>
                </AccordionContent>
             </AccordionItem>
            
            <Separator />

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : diet && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Piani Giornalieri</h3>
                  <div className="space-y-4">
                    {diet.dayTypes && diet.dayTypes.map((dayType) => (
                      <div key={dayType.id} className="rounded-lg border p-4 space-y-4 bg-card">
                        <div className="flex items-center gap-2">
                          <Input
                            value={dayType.name}
                            onChange={(e) => updateDayTypeName(dayType.id, e.target.value)}
                            className="font-bold text-base flex-grow"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeDayType(dayType.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                            {MEALS.map(meal => (
                                <div key={meal.key}>
                                    <h4 className="font-semibold text-md mb-2 flex items-center gap-2 text-primary">
                                       <meal.icon className="w-5 h-5" /> {meal.label}
                                    </h4>
                                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                       {(dayType[meal.key] || []).map(item => (
                                           <FoodItemRow 
                                               key={item.id}
                                               item={item}
                                               onUpdate={(updated) => updateFoodItem(dayType.id, meal.key, updated)}
                                               onDelete={() => removeFoodItem(dayType.id, meal.key, item.id)}
                                           />
                                       ))}
                                       <Button variant="outline" size="sm" onClick={() => addFoodItem(dayType.id, meal.key)} className="w-full">
                                         <Plus className="w-4 h-4 mr-2" /> Aggiungi Alimento a {meal.label}
                                       </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" className="mt-4 w-full" onClick={addDayType}>
                    <Plus className="w-4 h-4 mr-2" /> Aggiungi Piano Giornaliero
                  </Button>
                </div>

                {diet.dayTypes && diet.week && (
                    <AccordionItem value="week-plan" className="border-t pt-6">
                      <AccordionTrigger className="text-lg font-semibold flex items-center gap-2 p-4 rounded-lg border bg-card data-[state=closed]:bg-muted/30">
                        Piano Settimanale
                      </AccordionTrigger>
                      <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                        <div className="grid grid-cols-1 gap-4">
                          {WEEK_DAYS.map(({key, label}) => (
                              <div key={key} className="flex items-center justify-between gap-4">
                                <p className="font-medium text-base w-24 flex-shrink-0">{label}</p>
                                <Select 
                                    value={diet.week[key] || "none"}
                                    onValueChange={(value) => handleWeekDayChange(key, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleziona un piano..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nessuno</SelectItem>
                                    {diet.dayTypes.map(d => (
                                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                )}
              </>
            )}
          </Accordion>
        </ScrollArea>
        <SheetFooter>
          <Button onClick={handleSave} className="w-full" size="lg" disabled={loading || !diet}>Salva Dieta</Button>
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
    const [quantityInput, setQuantityInput] = useState<string>(item.quantity > 0 ? String(item.quantity) : '');

    useEffect(() => {
        setQuantityInput(item.quantity > 0 ? String(item.quantity) : '');
    }, [item.quantity]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setQuantityInput(value);
            onUpdate({ ...item, quantity: parseFloat(value) || 0 });
        }
    };
    
    const handleBlur = () => {
        if (quantityInput === '') {
            onUpdate({ ...item, quantity: 0 });
        }
    };

    return (
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
            <Input
              placeholder="Nome alimento"
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="flex-grow"
            />
            <Input
              type="text" 
              inputMode="decimal"
              value={quantityInput}
              onChange={handleQuantityChange}
              onBlur={handleBlur}
              placeholder="0"
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
