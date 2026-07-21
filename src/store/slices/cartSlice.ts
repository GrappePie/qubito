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
  notes?: string;
}

interface CartState {
  activeTableId: string | null; // null -> quick order
  activeTableName: string | null;
  activeTableNumber: number | null;
  carts: Record<string, CartItem[]>; // tableId -> items
  standalone: CartItem[]; // quick order items
}

const initialState: CartState = {
  activeTableId: null,
  activeTableName: null,
  activeTableNumber: null,
  carts: {},
  standalone: []
};

interface AddItemPayload { id: string; title: string; price: number; image?: string; stock?: number; sku?: string; }
interface UpdateQuantityPayload { id: string; delta?: number; quantity?: number; }
interface UpdateNotesPayload { id: string; notes: string; }

export interface HydrateOrderPayload {
  mode: "table" | "quick";
  tableId?: string | null;
  tableNameSnapshot?: string | null;
  tableNumber?: number | null;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    stock?: number;
    sku?: string;
    notes?: string;
  }>;
}

type SetActiveTablePayload = string | number | { id: string; name?: string | null; number?: number | null };

const normalizeTablePayload = (payload: SetActiveTablePayload) => {
  if (typeof payload === 'number') return { id: String(payload), name: `Mesa ${payload}`, number: payload };
  if (typeof payload === 'string') return { id: payload, name: null, number: null };
  return { id: payload.id, name: payload.name ?? null, number: payload.number ?? null };
};

const ensureTable = (state: CartState, tableId: string) => {
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
    setActiveTable: (state, action: PayloadAction<SetActiveTablePayload | null>) => {
      if (action.payload == null) {
        state.activeTableId = null;
        state.activeTableName = null;
        state.activeTableNumber = null;
        return;
      }
      const table = normalizeTablePayload(action.payload);
      state.activeTableId = table.id;
      state.activeTableName = table.name;
      state.activeTableNumber = table.number;
      ensureTable(state, table.id);
    },
    startQuickOrder: (state) => {
      state.activeTableId = null;
      state.activeTableName = null;
      state.activeTableNumber = null;
    },
    clearActiveTable: (state) => {
      state.activeTableId = null;
      state.activeTableName = null;
      state.activeTableNumber = null;
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
    updateItemNotes: (state, action: PayloadAction<UpdateNotesPayload>) => {
      const items = getActiveItems(state);
      const item = items.find(i => i.id === action.payload.id);
      if (!item) return;
      item.notes = action.payload.notes;
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
    clearTableCart: (state, action: PayloadAction<string | number | 'standalone'>) => {
      if (action.payload === 'standalone') {
        state.standalone = [];
      } else {
        state.carts[action.payload] = [];
      }
    },
    hydrateFromOrders: (state, action: PayloadAction<HydrateOrderPayload[]>) => {
      for (const order of action.payload) {
        const cartItems: CartItem[] = order.items.map(i => ({
          id: i.productId,
          title: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          stock: i.stock,
          sku: i.sku,
          notes: i.notes,
        }));
        const orderTableId = order.tableId ?? (order.tableNumber != null ? String(order.tableNumber) : null);
        if (order.mode === "table" && orderTableId != null) {
          // Only hydrate if the slot is currently empty (preserve in-session edits)
          if (!state.carts[orderTableId] || state.carts[orderTableId].length === 0) {
            state.carts[orderTableId] = cartItems;
          }
        }
      }
    },
  }
});

export const { setActiveTable, startQuickOrder, clearActiveTable, addItem, removeItem, updateQuantity, updateItemNotes, setActiveCartItems, clearActiveTableCart, clearTableCart, hydrateFromOrders } = cartSlice.actions;

// Selectors
export const selectActiveTableId = (state: { cart: CartState }) => state.cart.activeTableId;
export const selectActiveTableName = (state: { cart: CartState }) => state.cart.activeTableName;
export const selectActiveTableNumber = (state: { cart: CartState }) => state.cart.activeTableNumber;
export const selectIsQuickOrder = (state: { cart: CartState }) => state.cart.activeTableId == null;
export const selectCartItemsForTable = (tableId: string | number | 'standalone') => (state: { cart: CartState }) => {
  if (tableId === 'standalone') return state.cart.standalone;
  return state.cart.carts[tableId] || [];
};
export const selectSubtotalForTable = (tableId: string | number | 'standalone') => (state: { cart: CartState }) => {
  const items = (tableId === 'standalone') ? state.cart.standalone : (state.cart.carts[tableId] || []);
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
};
export const selectCartItems = (state: { cart: CartState }) => state.cart.activeTableId == null ? state.cart.standalone : (state.cart.carts[state.cart.activeTableId] || []);
export const selectSubtotal = (state: { cart: CartState }) => selectCartItems(state).reduce((acc, i) => acc + i.price * i.quantity, 0);

export default cartSlice.reducer;
