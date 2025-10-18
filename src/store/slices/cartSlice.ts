// cartSlice.ts - manages shopping cart state per table
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
  activeTableId: number | null;
  carts: Record<number, CartItem[]>; // tableId -> items
}

const initialState: CartState = {
  activeTableId: null,
  carts: {}
};

interface AddItemPayload { id: string; title: string; price: number; image?: string; }
interface UpdateQuantityPayload { id: string; delta?: number; quantity?: number; }

const ensureTable = (state: CartState, tableId: number) => {
  if (!state.carts[tableId]) state.carts[tableId] = [];
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setActiveTable: (state, action: PayloadAction<number>) => {
      state.activeTableId = action.payload;
      ensureTable(state, action.payload);
    },
    addItem: (state, action: PayloadAction<AddItemPayload>) => {
      const tableId = state.activeTableId;
      if (tableId == null) return; // ignore if no active table selected
      ensureTable(state, tableId);
      const items = state.carts[tableId];
      const { id, title, price, image } = action.payload;
      const existing = items.find(i => i.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({ id, title, price, quantity: 1, image });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const tableId = state.activeTableId;
      if (tableId == null) return;
      const items = state.carts[tableId];
      if (!items) return;
      state.carts[tableId] = items.filter(i => i.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<UpdateQuantityPayload>) => {
      const tableId = state.activeTableId;
      if (tableId == null) return;
      const items = state.carts[tableId];
      if (!items) return;
      const { id, delta, quantity } = action.payload;
      const item = items.find(i => i.id === id);
      if (!item) return;
      if (typeof quantity === 'number') {
        item.quantity = Math.max(1, quantity);
      } else if (typeof delta === 'number') {
        item.quantity = Math.max(1, item.quantity + delta);
      }
    },
    clearActiveTableCart: (state) => {
      const tableId = state.activeTableId;
      if (tableId == null) return;
      state.carts[tableId] = [];
    },
    clearTableCart: (state, action: PayloadAction<number>) => {
      state.carts[action.payload] = [];
    }
  }
});

export const { setActiveTable, addItem, removeItem, updateQuantity, clearActiveTableCart, clearTableCart } = cartSlice.actions;

// Selectors (RootState not imported to avoid circular in slice definition)
export const selectActiveTableId = (state: { cart: CartState }) => state.cart.activeTableId;
export const selectCartItemsForTable = (tableId: number) => (state: { cart: CartState }) => state.cart.carts[tableId] || [];
export const selectSubtotalForTable = (tableId: number) => (state: { cart: CartState }) => (state.cart.carts[tableId] || []).reduce((acc, i) => acc + i.price * i.quantity, 0);
export const selectCartItems = (state: { cart: CartState }) => {
  const id = state.cart.activeTableId;
  return id == null ? [] : (state.cart.carts[id] || []);
};
export const selectSubtotal = (state: { cart: CartState }) => {
  const id = state.cart.activeTableId;
  return id == null ? 0 : (state.cart.carts[id] || []).reduce((acc, i) => acc + i.price * i.quantity, 0);
};

export default cartSlice.reducer;
