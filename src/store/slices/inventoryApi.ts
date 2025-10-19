"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface InventoryListItem {
  _id: string;
  name: string;
  // Campos opcionales según backend actual
  price?: number;
  stock?: number;
  quantity?: number;
  imageUrl?: string;
  category?: string;
}

export interface AdjustmentEntry {
  date: string;
  previousStock: number;
  newStock: number;
  reason?: string;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Inventory', 'History'],
  endpoints: (builder) => ({
    getInventoryList: builder.query<InventoryListItem[], void>({
      query: () => ({ url: 'inventory/list' }),
      providesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),
    adjustStock: builder.mutation<{ success: boolean; product: unknown }, { productId: string; newStock: number; reason?: string }>({
      query: (body) => ({ url: 'inventory/adjust', method: 'POST', body }),
      // No puede invalidar tags de otros slices (productsApi), así que la UI debe refetch explícito si usa productos
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),
    getHistory: builder.query<{ success: boolean; history: AdjustmentEntry[] }, { productId: string }>({
      query: ({ productId }) => ({ url: `inventory/history?productId=${productId}` }),
      providesTags: (_res, _err, arg) => [{ type: 'History', id: arg.productId }],
    }),
  }),
});

export const {
  useGetInventoryListQuery,
  useAdjustStockMutation,
  useGetHistoryQuery,
  useLazyGetHistoryQuery,
} = inventoryApi;

