export type Store = 'famila' | 'lidl' | 'primoprezzo';

export const stores: Store[] = ['famila', 'lidl', 'primoprezzo'];

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  prices: Partial<Record<Store, number>>;
  selectedStore?: Store | null; // This can be removed if not used elsewhere, but keeping it is safe
};
