// cartSlice.ts - manages shopping cart state per table or standalone quick order
"use client";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  title: string;
  price: number; // unit price
  quantity: number;
  image?: string;
  stock?: number; // máximo permitido según inventario
  sku?: string;
}

interface CartState {
  activeTableId: number | null; // null -> quick order
  carts: Record<number, CartItem[]>; // tableId -> items
  standalone: CartItem[]; // quick order items
}

const initialState: CartState = {
  activeTableId: null,
  carts: {},
  standalone: []
};

interface AddItemPayload { id: string; title: string; price: number; image?: string; stock?: number; sku?: string; }
interface UpdateQuantityPayload { id: string; delta?: number; quantity?: number; }

const ensureTable = (state: CartState, tableId: number) => {
  if (!state.carts[tableId]) state.carts[tableId] = [];
};

const getActiveItems = (state: CartState): CartItem[] => {
  if (state.activeTableId == null) return state.standalone;
  ensureTable(state, state.activeTableId);
  return state.carts[state.activeTableId];
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setActiveTable: (state, action: PayloadAction<number | null>) => {
      state.activeTableId = action.payload;
      if (action.payload != null) ensureTable(state, action.payload);
    },
    startQuickOrder: (state) => {
      state.activeTableId = null;
    },
    clearActiveTable: (state) => {
      state.activeTableId = null;
    },
    addItem: (state, action: PayloadAction<AddItemPayload>) => {
      const items = getActiveItems(state);
      const { id, title, price, image, stock, sku } = action.payload;
      const existing = items.find(i => i.id === id);
      const max = typeof stock === 'number' ? stock : (existing?.stock ?? Infinity);
      if (max <= 0) return; // no agregar si no hay stock
      if (existing) {
        existing.stock = max; // mantener actualizado
        existing.quantity = Math.min(existing.quantity + 1, max);
        if (sku) existing.sku = sku;
      } else {
        items.push({ id, title, price, quantity: Math.min(1, max), image, stock: max, sku });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const items = getActiveItems(state);
      const idx = items.findIndex(i => i.id === action.payload);
      if (idx >= 0) items.splice(idx, 1);
    },
    updateQuantity: (state, action: PayloadAction<UpdateQuantityPayload>) => {
      const items = getActiveItems(state);
      const { id, delta, quantity } = action.payload;
      const item = items.find(i => i.id === id);
      if (!item) return;
      const max = typeof item.stock === 'number' ? item.stock : Infinity;
      const effMax = Math.max(1, max);
      if (typeof quantity === 'number') {
        item.quantity = Math.min(Math.max(1, quantity), effMax);
      } else if (typeof delta === 'number') {
        item.quantity = Math.min(Math.max(1, item.quantity + delta), effMax);
      }
    },
    setActiveCartItems: (state, action: PayloadAction<CartItem[]>) => {
      if (state.activeTableId == null) {
        state.standalone = action.payload;
      } else {
        ensureTable(state, state.activeTableId);
        state.carts[state.activeTableId] = action.payload;
      }
    },
    clearActiveTableCart: (state) => {
      if (state.activeTableId == null) {
        state.standalone = [];
      } else {
        state.carts[state.activeTableId] = [];
      }
    },
    clearTableCart: (state, action: PayloadAction<number | 'standalone'>) => {
      if (action.payload === 'standalone') {
        state.standalone = [];
      } else {
        state.carts[action.payload] = [];
      }
    }
  }
});

export const { setActiveTable, startQuickOrder, clearActiveTable, addItem, removeItem, updateQuantity, setActiveCartItems, clearActiveTableCart, clearTableCart } = cartSlice.actions;

// Selectors
export const selectActiveTableId = (state: { cart: CartState }) => state.cart.activeTableId;
export const selectIsQuickOrder = (state: { cart: CartState }) => state.cart.activeTableId == null;
export const selectCartItemsForTable = (tableId: number | 'standalone') => (state: { cart: CartState }) => {
  if (tableId === 'standalone') return state.cart.standalone;
  return state.cart.carts[tableId] || [];
};
export const selectSubtotalForTable = (tableId: number | 'standalone') => (state: { cart: CartState }) => {
  const items = (tableId === 'standalone') ? state.cart.standalone : (state.cart.carts[tableId] || []);
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
};
export const selectCartItems = (state: { cart: CartState }) => state.cart.activeTableId == null ? state.cart.standalone : (state.cart.carts[state.cart.activeTableId] || []);
export const selectSubtotal = (state: { cart: CartState }) => selectCartItems(state).reduce((acc, i) => acc + i.price * i.quantity, 0);

export default cartSlice.reducer;
