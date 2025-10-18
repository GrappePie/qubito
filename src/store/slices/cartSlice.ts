// cartSlice.ts - manages shopping cart state
"use client";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  title: string;
  price: number; // unit price
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

interface AddItemPayload { id: string; title: string; price: number; image?: string; }
interface UpdateQuantityPayload { id: string; delta?: number; quantity?: number; }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<AddItemPayload>) => {
      const { id, title, price, image } = action.payload;
      const existing = state.items.find(i => i.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ id, title, price, quantity: 1, image });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<UpdateQuantityPayload>) => {
      const { id, delta, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      if (typeof quantity === 'number') {
        item.quantity = Math.max(1, quantity);
      } else if (typeof delta === 'number') {
        item.quantity = Math.max(1, item.quantity + delta);
      }
    },
    clearCart: (state) => {
      state.items = [];
    }
  }
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectSubtotal = (state: { cart: CartState }) => state.cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

export default cartSlice.reducer;

