"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface RestaurantTableDTO {
  id: string;
  tableId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  legacyNumber?: number | null;
}

export const tablesApi = createApi({
  reducerPath: 'tablesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('qubito_tenant');
        const sub = window.localStorage.getItem('qubito_sub');
        if (t) headers.set('x-tenant-id', t);
        if (sub) headers.set('x-user-sub', sub);
      }
      return headers;
    },
  }),
  tagTypes: ['Tables'],
  endpoints: (builder) => ({
    getTables: builder.query<RestaurantTableDTO[], { includeInactive?: boolean } | void>({
      query: (arg) => ({
        url: `tables${arg?.includeInactive ? '?includeInactive=1' : ''}`,
        method: 'GET',
      }),
      transformResponse: (response: { tables: RestaurantTableDTO[] }) => response.tables,
      providesTags: [{ type: 'Tables', id: 'LIST' }],
    }),
    createTable: builder.mutation<RestaurantTableDTO, { name: string }>({
      query: (body) => ({ url: 'tables', method: 'POST', body }),
      transformResponse: (response: { table: RestaurantTableDTO }) => response.table,
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),
    updateTable: builder.mutation<
      RestaurantTableDTO,
      { tableId: string; data: Partial<Pick<RestaurantTableDTO, 'name' | 'sortOrder' | 'isActive'>> }
    >({
      query: ({ tableId, data }) => ({
        url: `tables/${encodeURIComponent(tableId)}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { table: RestaurantTableDTO }) => response.table,
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),
    deleteTable: builder.mutation<RestaurantTableDTO, string>({
      query: (tableId) => ({
        url: `tables/${encodeURIComponent(tableId)}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { table: RestaurantTableDTO }) => response.table,
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} = tablesApi;
