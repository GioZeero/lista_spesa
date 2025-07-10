export type Store = 'famila' | 'lidl' | 'primoprezzo';

export const stores: Store[] = ['famila', 'lidl', 'primoprezzo'];

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  prices: Partial<Record<Store, number>>;
};
