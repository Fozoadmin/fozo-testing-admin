import type { GroceryUnit } from '@/types';

export const GROCERY_UNITS = ['piece', 'kg', 'g', 'l', 'ml', 'dozen', 'pack'] as const;

export type ItemFormValues = {
  storeId: string;
  itemName: string;
  category: string;
  description: string;
  imageUrl: string;
  price: string;
  mrp: string;
  unit: GroceryUnit;
  quantityAvailable: string;
  totalQuantityListed: string;
  isActive: boolean;
  isInStock: boolean;
};

export const emptyItemForm: ItemFormValues = {
  storeId: '',
  itemName: '',
  category: '',
  description: '',
  imageUrl: '',
  price: '',
  mrp: '',
  unit: 'piece',
  quantityAvailable: '0',
  totalQuantityListed: '0',
  isActive: true,
  isInStock: true,
};
