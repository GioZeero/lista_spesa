export type Store = 'famila' | 'lidl' | 'primoprezzo';

export const stores: Store[] = ['famila', 'lidl', 'primoprezzo'];

// Rappresenta un singolo alimento in una dieta
export type DietFoodItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string; // es. 'kg', 'g', 'L', 'ml', 'pezzi'
};

// Rappresenta un "giorno tipo" riutilizzabile
export type DayType = {
  id: string;
  name: string;
  items: DietFoodItem[];
};

// Rappresenta l'assegnazione dei giorni tipo alla settimana
export type WeekPlan = {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
};

// La struttura completa del piano dieta
export type DietPlan = {
  dayTypes: DayType[];
  week: WeekPlan;
};

export type Freshness = 'green' | 'yellow' | 'red';

// Rappresenta un articolo nella lista della spesa finale
export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  prices: Partial<Record<Store, number>>;
  freshness: Freshness;
};
